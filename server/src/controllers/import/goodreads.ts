import { createExpressRoute } from 'typescript-routes-to-openapi-server';
import { XMLParser } from 'fast-xml-parser';
import axios from 'axios';
import _ from 'lodash';

import { MediaItemBase } from 'src/entity/mediaItem';
import { Watchlist } from 'src/entity/watchlist';
import { Seen } from 'src/entity/seen';
import { UserRating } from 'src/entity/userRating';
import { mediaItemRepository } from 'src/repository/mediaItem';
import { watchlistRepository } from 'src/repository/watchlist';
import { seenRepository } from 'src/repository/seen';
import { userRatingRepository } from 'src/repository/userRating';

export class GoodreadsImportController {
  /**
   * @openapi_operationId import
   */
  import = createExpressRoute<{
    path: '/api/import-goodreads';
    method: 'post';
    requestBody: {
      url: string;
    };
    responseBody: GoodreadsImport;
  }>(async (req, res) => {
    const userId = Number(req.user);

    const { url } = req.body;

    const summary = await importFromGoodreadsRss(url, userId);

    res.send(summary);
  });
}

type GoodreadsImport = {
  read: number;
  toRead: number;
  currentlyReading: number;
  ratings: number;
};

export const importFromGoodreadsRss = async (
  url: string,
  userId: number
): Promise<GoodreadsImport> => {
  const res = await axios.get(url);

  const parser = new XMLParser();
  const feed: RssFeed = parser.parse(res.data);
  const items = feed?.rss?.channel?.item;

  const mediaItems = items?.map(
    (item): MediaItemBase => ({
      title: item.title,
      mediaType: 'book',
      source: 'goodreads',
      goodreadsId: item.book_id,
      overview: item.book_description,
      poster: item.book_large_image_url,
      authors: [item.author_name],
      releaseDate: item.book_published?.toString(),
      numberOfPages: item.book?.num_pages,
    })
  );

  const addedItems =
    await mediaItemRepository.mergeSearchResultWithExistingItems(
      mediaItems,
      'book'
    );

  const mediaItemByGoodreadsIdMap = _.keyBy(
    addedItems.mergeWithSearchResult(),
    'goodreadsId'
  );

  const toRead = items
    ?.filter((item) => item.user_shelves === 'to-read')
    .map(
      (item): Watchlist => ({
        mediaItemId: mediaItemByGoodreadsIdMap[item.book_id].id,
        userId: userId,
        addedAt: new Date(item.user_date_added).getTime(),
      })
    );

  const currentlyReading = items
    ?.filter((item) => item.user_shelves === 'currently-reading')
    .map(
      (item): Seen => ({
        mediaItemId: mediaItemByGoodreadsIdMap[item.book_id].id,
        userId: userId,
        startedAt: new Date(item.user_date_added).getTime(),
        date: new Date().getTime(),
        action: 'started',
      })
    );

  const read = items
    ?.filter((item) => item.user_shelves === '')
    .map(
      (item): Seen => ({
        mediaItemId: mediaItemByGoodreadsIdMap[item.book_id].id,
        userId: userId,
        startedAt: new Date(item.user_date_added).getTime(),
        date: item.user_read_at ? new Date(item.user_read_at).getTime() : null,
        action: 'watched',
      })
    );

  const rating = items
    ?.filter((item) => item.user_rating || item.user_review)
    .map(
      (item): UserRating => ({
        mediaItemId: mediaItemByGoodreadsIdMap[item.book_id].id,
        userId: userId,
        rating: item.user_rating,
        review: item.user_review,
        date: new Date(item.user_date_added).getTime(),
      })
    );

  const seenUniqueBy = (value: Seen) => ({
    mediaItemId: value.mediaItemId,
    startedAt: value.startedAt,
    action: value.action,
  });

  await watchlistRepository.createMany(toRead);
  await seenRepository.createManyUnique(read, seenUniqueBy);
  await seenRepository.createManyUnique(currentlyReading, seenUniqueBy);
  await userRatingRepository.createMany(rating);

  return {
    currentlyReading: currentlyReading.length,
    ratings: rating.length,
    read: read.length,
    toRead: toRead.length,
  };
};

interface RssFeed {
  rss: {
    channel: {
      'xhtml:meta': string;
      title: string;
      copyright: string;
      link: string;
      'atom:link': string;
      description: string;
      language: string;
      lastBuildDate: string;
      ttl: number;
      image: {
        title: string;
        link: string;
        width: number;
        height: number;
        url: string;
      };
      item: {
        guid: string;
        pubDate: string;
        title: string;
        link: string;
        book_id: number;
        book_image_url: string;
        book_small_image_url: string;
        book_medium_image_url: string;
        book_large_image_url: string;
        book_description: string;
        book: {
          num_pages: number;
        };
        author_name: string;
        isbn: unknown;
        user_name: string;
        user_rating: number;
        user_read_at: string;
        user_date_added: string;
        user_date_created: string;
        user_shelves: string;
        user_review: string;
        average_rating: number;
        book_published: number;
      }[];
    };
  };
}
