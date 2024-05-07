import { Knex } from 'knex';
import _ from 'lodash';
import fs from 'fs';
import path from 'path';
import { StaticConfiguration } from '../staticConfiguration.js';

// delete all images - first version of MediaTracker would download multiple duplicates of images
export async function up(knex: Knex): Promise<void> {
  for (const file of fs.readdirSync(StaticConfiguration.assetsDir)) {
    const fullPath = path.join(StaticConfiguration.assetsDir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isFile()) {
      fs.unlinkSync(fullPath);
    } else if (stat.isDirectory()) {
      fs.rmdirSync(fullPath, { recursive: true });
    }
  }
}

export async function down(knex: Knex): Promise<void> {}
