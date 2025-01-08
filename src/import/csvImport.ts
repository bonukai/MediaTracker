import { parse } from 'csv-parse/sync';
import _ from 'lodash';
import { record, z } from 'zod';

import { ImportDataType, ImportListItem, ImportRatingItem, ImportSeenHistoryItem, ImportWatchlistItem } from '../repository/importRepository.js';
import { listRepository } from '../repository/listRepository.js';
import { mediaTypeSchema } from '../entity/mediaItemModel.js';

export const csvImport = {
  async map(user: number, csvData: string): Promise<ImportDataType> {
    const data = csvImportSchema.parse(
      parse(csvData, {
        bom: true,                     //detects and removes any utf-8 byte order marks
        delimiter: ',',                //did you know the "C" in CSV stands for "comma"? :)
        columns: header => header.map((column: string) => column.toLowerCase()),
        skip_empty_lines: true,        //blank lines are ignored
        skip_records_with_error: true, //if any field parsing errors (eg: invalid numbers), skip entire record
        trim: true                     //strip leading and trailing whitespace in fields
      })
    )
    .filter(item => 
      (Object.values(mediaTypeSchema.Values).includes(item.type)) // sanity check
      && ((item.type === 'tv' && (item.tmdbid || item.imdbid || item.tvdbid))
         ||(item.type === 'movie' && (item.tmdbid || item.imdbid)))
    );

    const dateNow = new Date();
    const userLists = await listRepository.getLists({userId: user});
    const watchListId = userLists.find(userList => userList.isWatchlist)?.id;

    const importLists = _(data)
      .map((item) => item.listid)
      .uniq()
      .value();

    const importData: ImportDataType = {
      ratings: data
        .filter((item) => item.rating && item.rating > 0)
        .map((item) => (<ImportRatingItem>{
          itemType: item.type,
          tmdbId: item.tmdbid ? item.tmdbid : undefined,
          imdbId: item.imdbid ? item.imdbid : undefined,
          tvdbId: item.tvdbid ? item.tvdbid : undefined,
          rating: item.rating,
          ratedAt: dateNow,
          episode: item.type === 'tv' ? {
            seasonNumber: item.season ? item.season : undefined,
            episodeNumber: item.episode ? item.episode : undefined
          } : undefined
      })),
      watchlist: data
        .filter((item) => item.listid && watchListId && item.listid == watchListId)
        .map((item) => (<ImportWatchlistItem>{
          itemType: item.type,
          tmdbId: item.tmdbid ? item.tmdbid : undefined,
          imdbId: item.imdbid ? item.imdbid : undefined,
          tvdbId: item.tvdbid ? item.tvdbid : undefined,
          addedAt: dateNow
      })),
      seenHistory: data
        .filter((item) => item.seen == 'Y')
        .map((item) => (<ImportSeenHistoryItem>{
          itemType: item.type === 'tv' ? 'episode' : item.type,
          tmdbId: item.tmdbid ? item.tmdbid : undefined,
          imdbId: item.imdbid ? item.imdbid : undefined,
          tvdbId: item.tvdbid ? item.tvdbid : undefined,
          seenAt: dateNow,
          episode: item.type === 'tv' ? {
            seasonNumber: item.season ? item.season : undefined,
            episodeNumber: item.episode ? item.episode : undefined
          } : undefined
      })),
      lists: userLists
        .filter((userList) => importLists.find(importList =>
          !userList.isWatchlist && importList == userList.id))
        .map((list) => (<ImportListItem>{
          name: list.name,
          description: list.description,
          traktId: list.traktId,
          createdAt: dateNow,
          items: data
            .filter((item) => item.listid == list.id)
            .map((item) => ({
              itemType: item.type,
              tmdbId: item.tmdbid ? item.tmdbid : undefined,
              imdbId: item.imdbid ? item.imdbid : undefined,
              tvdbId: item.tvdbid ? item.tvdbid : undefined,
              addedAt: dateNow
        }))
      }))
    }

    return importData;
  },
};

const csvImportSchema = z.array(
  z.object({
    //lowercase every column name to allow case insensitive parsing
    type: z.enum(['tv', 'movie']),
    tmdbid: z.coerce.number().optional(),
    imdbid: z.string().optional(),
    tvdbid: z.coerce.number().optional(),
    listid: z.coerce.number().optional(),
    rating: z.coerce.number().optional(),
    seen: z.string().optional(),
    season: z.coerce.number().optional(),
    episode: z.coerce.number().optional()
  })
);
