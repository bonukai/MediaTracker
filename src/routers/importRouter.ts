import _ from 'lodash';
import { z } from 'zod';

import { backupImport } from '../import/backupImport.js';
import { floxImport } from '../import/floxImport.js';
import { goodreadsImport } from '../import/goodreadsImport.js';
import { simklImport } from '../import/simklImport.js';
import { csvImport } from '../import/csvImport.js';
import {
  importRepository,
  ImportState,
} from '../repository/importRepository.js';
import { protectedProcedure, router } from '../router.js';

const importSourceSchema = z.enum([
  'Flox',
  'TraktTv',
  'Goodreads',
  'Simkl',
  'MediaTracker',
  'CSV'
]);

export type ImportSource = z.infer<typeof importSourceSchema>;

export const importRouter = router({
  fromFile: protectedProcedure
    .input(z.object({ source: importSourceSchema, data: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { userId } = ctx;
      const { source, data } = input;

      await importFromFileHandler({ userId, source, data });
    }),
  TraktTv: protectedProcedure.query(async ({ ctx }) => {
    const { userId } = ctx;
  }),
  progress: protectedProcedure
    .input(z.object({ source: importSourceSchema }))
    .query(async ({ input, ctx }) => {
      return progressMap.get({
        userId: ctx.userId,
        source: input.source,
      });
    }),
  resetProgress: protectedProcedure
    .input(z.object({ source: importSourceSchema }))
    .mutation(async ({ input, ctx }) => {
      const progress = progressMap.get({
        userId: ctx.userId,
        source: input.source,
      });

      if (progress?.state === 'imported') {
        progressMap.remove({
          userId: ctx.userId,
          source: input.source,
        });
      }
    }),
});

const importFromFileHandler = async (args: {
  userId: number;
  source: ImportSource;
  data: string;
}) => {
  const { userId, source, data } = args;

  if (progressMap.has({ userId, source })) {
    throw new Error(
      `import from user ${userId}, source: ${source} is in progress`
    );
  }

  progressMap.set({
    userId: userId,
    source: source,
    state: {
      state: 'parsing-input-file',
    },
  });

  try {
    const importData = await mapImportData(userId, source, data);

    await importRepository.importDataByExternalIds({
      userId,
      importData,
      onUpdate(state) {
        progressMap.set({
          userId: userId,
          source: source,
          state,
        });
      },
    });
  } catch (error) {
    progressMap.remove({ userId, source });
    throw error;
  }
};

const progressMap = (() => {
  const map = new Map<string, ImportState>();

  const set = (args: {
    userId: number;
    source: ImportSource;
    state: ImportState;
  }) => {
    map.set([args.userId, args.source].toString(), args.state);
  };
  const get = (args: { userId: number; source: ImportSource }) => {
    return map.get([args.userId, args.source].toString()) || null;
  };
  const remove = (args: { userId: number; source: ImportSource }) => {
    map.delete([args.userId, args.source].toString());
  };

  const has = (args: { userId: number; source: ImportSource }) => {
    return get(args) !== null;
  };

  return { set, get, remove, has };
})();

const mapImportData = async (userId: number, source: ImportSource, data: string) => {
  switch (source) {
    case 'Flox':
      return floxImport.map(data);
    case 'TraktTv':
    case 'Goodreads':
      return goodreadsImport.map(data);
    case 'Simkl':
      return simklImport.map(data);
    case 'MediaTracker':
      return backupImport.map(data);
    case 'CSV':
      return csvImport.map(userId, data);
  }
};
