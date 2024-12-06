import { parse } from 'csv-parse/sync';
import _ from 'lodash';
import { record, z } from 'zod';

import { ImportDataType, ImportListItem, ImportSeenHistoryItem, ImportWatchlistItem } from '../repository/importRepository.js';
import { listRepository } from '../repository/listRepository.js';
import { itemTypeSchema } from '../entity/mediaItemModel.js';

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
    );
    
    const dateNow = new Date();
    const userLists = await listRepository.getLists({userId: user});
    const watchListId = userLists.find(userList => userList.isWatchlist)?.id;

    const importlists = _(data)
      .map((item) => item.listid)
      .uniq()
      .value();

    const importData: ImportDataType = {};

    importData.watchlist = data
      .filter((item) => item.listid == watchListId)
      .map((item) => (<ImportWatchlistItem>{
        itemType: item.type,
        imdbId: item.imdbid,
        tmdbId: item.tmdbid,
        tvdbId: item.tvdbid,
        addedAt: dateNow
    }));

    importData.lists = userLists
      .filter((list) => importlists.find(l => l == list.id && !list.isWatchlist))
      .map((list) => (<ImportListItem>{
        name: list.name,
        description: list.description,
        traktId: list.traktId,
        createdAt: dateNow,
        items: data
          .filter((item) => item.listid == list.id)
          .map((item) => ({
            itemType: item.type,
            imdbId: item.imdbid,
            tmdbId: item.tmdbid,
            tvdbId: item.tvdbid,
            addedAt: dateNow
        }))
      }));

    importData.seenHistory = data
      .filter((item) => item.watched == 'Y')
      .map((item) => (<ImportSeenHistoryItem>{
        itemType: item.type === 'tv' ? 'episode' : item.type,
        imdbId: item.imdbid,
        tmdbId: item.tmdbid,
        tvdbId: item.tvdbid,
        seenAt: dateNow,
        episode: {
          episodeNumber: item.episode,
          seasonNumber: item.season
        }
    }));

    return importData;
  },
};

const csvImportSchema = z.array(
  z.object({
    //lowercase every column to allow case insensitive parsing
    type: z.enum(['tv', 'movie']),
    imdbid: z.string().optional(),
    tmdbid: z.coerce.number().optional(),
    tvdbid: z.coerce.number().optional(),
    listid: z.coerce.number().optional(),
    watched: z.string().optional().default('N'),
    season: z.coerce.number().optional(),
    episode: z.coerce.number().optional()
  })
);
