import { Knex } from 'knex';
import _ from 'lodash';
import fs from 'fs';
import path from 'path';
import { StaticConfiguration } from '../staticConfiguration.js';

export async function up(knex: Knex): Promise<void> {
  const mediaItemsWithPosters =
    await knex('mediaItem').whereNotNull('posterId');

  const mediaItemsWithBackdrops =
    await knex('mediaItem').whereNotNull('backdropId');

  const seasonsWithPosters = await knex('season').whereNotNull('posterId');

  const imageIds = new Set(
    [
      ...mediaItemsWithPosters.map((mediaItem) => mediaItem.posterId),
      ...mediaItemsWithBackdrops.map((mediaItem) => mediaItem.backdropId),
      ...seasonsWithPosters.map((season) => season.posterId),
    ]
      .filter((posterId) => typeof posterId === 'string')
      .map((posterId) => `${posterId}.webp`)
  );

  for (const posterDirs of fs.readdirSync(StaticConfiguration.assetsDir)) {
    const fullPath = path.join(StaticConfiguration.assetsDir, posterDirs);

    if (fs.statSync(fullPath).isDirectory()) {
      for (const image of fs.readdirSync(fullPath)) {
        if (!imageIds.has(image)) {
          if (fs.statSync(fullPath).isFile()) {
            fs.unlinkSync(fullPath);
          }
        }
      }
    }
  }
}

export async function down(knex: Knex): Promise<void> {}
