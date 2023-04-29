import { createExpressRoute } from 'typescript-routes-to-openapi-server';
import { XMLParser } from 'fast-xml-parser';
import axios from 'axios';
import _ from 'lodash';

import { MediaItemBase } from 'src/entity/mediaItem';
import { Seen } from 'src/entity/seen';
import { UserRating } from 'src/entity/userRating';
import { mediaItemRepository } from 'src/repository/mediaItem';
import { seenRepository } from 'src/repository/seen';
import { userRatingRepository } from 'src/repository/userRating';
import { listItemRepository } from 'src/repository/listItemRepository';
import { listRepository } from 'src/repository/list';

/**
 * @openapi_tags GoodreadsImport
 */
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
      numberOfPages:
        typeof item.book?.num_pages === 'number'
          ? item.book.num_pages
          : undefined,
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
    .map((item) => ({
      mediaItemId: mediaItemByGoodreadsIdMap[item.book_id].id,
      addedAt: new Date(item.user_date_added).getTime(),
    }));

  const currentlyReading = items
    ?.filter((item) => item.user_shelves === 'currently-reading')
    .map(
      (item): Seen => ({
        mediaItemId: mediaItemByGoodreadsIdMap[item.book_id].id,
        userId: userId,
        date: new Date(item.user_date_added).getTime(),
        progress: 0,
        type: 'progress',
      })
    );

  const read = items
    ?.filter((item) => item.user_shelves === '')
    .map(
      (item): Seen => ({
        mediaItemId: mediaItemByGoodreadsIdMap[item.book_id].id,
        userId: userId,
        date: item.user_read_at ? new Date(item.user_read_at).getTime() : null,
        type: 'seen',
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

  const lists = _.groupBy(
    items.filter(
      (item) =>
        item.user_shelves !== 'to-read' &&
        item.user_shelves !== 'currently-reading' &&
        item.user_shelves !== '' &&
        item.user_shelves
    ),
    'user_shelves'
  );

  const seenUniqueBy = (value: Seen) => ({
    mediaItemId: value.mediaItemId,
    date: value.date,
    type: value.type,
  });

  for (const [listName, listItems] of Object.entries(lists)) {
    const newListName = `Goodreads-${listName}`;

    const list =
      (await listRepository.findOne({
        name: newListName,
      })) ||
      (await listRepository.create({
        name: newListName,
        userId: userId,
      }));

    for (const listItem of listItems) {
      await listItemRepository.addItem({
        listId: list.id,
        userId: userId,
        mediaItemId: mediaItemByGoodreadsIdMap[listItem.book_id].id,
      });
    }
  }

  for (const listItem of toRead) {
    await listItemRepository.addItem({
      watchlist: true,
      userId: userId,
      mediaItemId: listItem.mediaItemId,
    });
  }

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
