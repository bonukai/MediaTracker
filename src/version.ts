import fs from 'fs';
import path from 'path';

import { z } from 'zod';
import { __dirname } from './dirname.js';

const packageJsonSchema = z.object({
  version: z.string(),
});

const packageJsonPath = path.join(__dirname, '../package.json');
const packageJson = packageJsonSchema.parse(
  JSON.parse(
    fs.readFileSync(packageJsonPath, {
      encoding: 'utf-8',
    })
  )
);

export const MediaTrackerVersion = packageJson.version;
