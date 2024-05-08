import fs from 'fs/promises';
import _ from 'lodash';
import path from 'path';
import { z } from 'zod';

import { TRPCError } from '@trpc/server';

import {
  adminOnlyProtectedProcedure,
  protectedProcedure,
  router,
} from '../router.js';
import { StaticConfiguration } from '../staticConfiguration.js';

const validateLogFilename = (filename: string): boolean => {
  return filename.match(/^\d{4}-\d{2}-\d{2}\.txt$/) !== null;
};

export const logsRouter = router({
  getLogFiles: adminOnlyProtectedProcedure
    .output(z.array(z.string()))
    .query(async () => {
      const logFiles = await fs.readdir(StaticConfiguration.logsDir);

      return _(logFiles)
        .filter(validateLogFilename)
        .sortBy((file) => new Date(file.substring(0, file.length - 4)))
        .reverse()
        .value();
    }),
  getLogFile: protectedProcedure
    .input(
      z.object({
        filename: z
          .string()
          .refine(
            validateLogFilename,
            'invalid log filename format, accepts only YYYY-MM-DD.txt'
          ),
      })
    )
    .output(z.string())
    .query(async ({ input }) => {
      const { filename } = input;
      const logFilePath = path.resolve(StaticConfiguration.logsDir, filename);

      if (!isChildOfDirectory(StaticConfiguration.logsDir, logFilePath)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
        });
      }

      return await fs.readFile(logFilePath, {
        encoding: 'utf-8',
      });
    }),
});

const isChildOfDirectory = (parent: string, child: string): boolean => {
  return path.resolve(child).startsWith(path.resolve(parent));
};
