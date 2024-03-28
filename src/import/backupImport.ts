import { mediaTrackerJsonExportSchema } from '../repository/exportRepository.js';
import { ImportDataType } from '../repository/importRepository.js';

export const backupImport = {
  map(json: string): ImportDataType {
    const data = mediaTrackerJsonExportSchema.parse(JSON.parse(json));

    return {
      ratings: data.ratings.map((item) => ({
        ...item,
        ratedAt: item.date ? new Date(item.date) : undefined,
      })),
      seenHistory: data.seenHistory.map((item) => ({
        ...item,
        seenAt: item.date ? new Date(item.date) : undefined,
      })),
      watchlist: data.watchlist.map((item) => ({
        ...item,
        addedAt: item.addedAt ? new Date(item.addedAt) : undefined,
      })),
      lists: data.lists.map((item) => ({
        ...item,
        createdAt: item.createdAt ? new Date(item.createdAt) : undefined,
        items: item.items.map((item) => ({
          ...item,
          addedAt: item.addedAt ? new Date(item.addedAt) : undefined,
        })),
      })),
    };
  },
};
