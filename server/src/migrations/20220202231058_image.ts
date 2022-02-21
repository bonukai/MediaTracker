import { t } from '@lingui/macro';
import chalk from 'chalk';
import { existsSync, moveSync, rmSync } from 'fs-extra';
import { Knex } from 'knex';
import { customAlphabet } from 'nanoid';
import path from 'path';

import { ASSETS_PATH } from 'src/config';

const nanoid = customAlphabet('1234567890abcdef', 32);

const moveAsset = (
  type: 'poster' | 'backdrop',
  itemType: 'media_item' | 'season',
  id: number,
  posterId: string
) => {
  const posterPath = path.resolve(
    ASSETS_PATH,
    type,
    itemType,
    'original',
    `${id}.webp`
  );

  if (existsSync(posterPath)) {
    moveSync(
      posterPath,
      path.resolve(ASSETS_PATH, 'original', `${posterId}.webp`)
    );
  }

  const posterSmallPath = path.resolve(
    ASSETS_PATH,
    type,
    itemType,
    'small',
    `${id}.webp`
  );

  if (existsSync(posterSmallPath)) {
    moveSync(
      posterSmallPath,
      path.resolve(ASSETS_PATH, 'small', `${posterId}.webp`)
    );
  }
};

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('image', (table) => {
    table.string('id').unique().primary();
    table
      .integer('mediaItemId')
      .notNullable()
      .references('id')
      .inTable('mediaItem');
    table.integer('seasonId').references('id').inTable('season');
    table.string('type').notNullable();

    table.index('mediaItemId');
    table.index('seasonId');
    table.index('type');
  });

  const mediaItemsWithPosters = await knex('mediaItem').whereNotNull('poster');

  for (const mediaItem of mediaItemsWithPosters) {
    const posterId = nanoid();

    await knex('image').insert({
      id: posterId,
      mediaItemId: mediaItem.id,
      type: 'poster',
    });

    moveAsset('poster', 'media_item', mediaItem.id, posterId);
  }

  const mediaItemsWithBackdrops = await knex('mediaItem').whereNotNull(
    'backdrop'
  );

  for (const mediaItem of mediaItemsWithBackdrops) {
    const posterId = nanoid();

    await knex('image').insert({
      id: posterId,
      mediaItemId: mediaItem.id,
      type: 'backdrop',
    });

    moveAsset('backdrop', 'media_item', mediaItem.id, posterId);
  }

  const seasonsWithPoster = await knex('season').whereNotNull('poster');

  for (const season of seasonsWithPoster) {
    const posterId = nanoid();

    await knex('image').insert({
      id: posterId,
      mediaItemId: season.tvShowId,
      seasonId: season.id,
      type: 'poster',
    });

    moveAsset('poster', 'season', season.id, posterId);
  }

  try {
    if (existsSync(path.resolve(ASSETS_PATH, 'backdrop'))) {
      rmSync(path.resolve(ASSETS_PATH, 'backdrop'), {
        recursive: true,
        force: true,
      });
    }

    if (existsSync(path.resolve(ASSETS_PATH, 'poster'))) {
      rmSync(path.resolve(ASSETS_PATH, 'poster'), {
        recursive: true,
        force: true,
      });
    }
  } catch (error) {
    console.log(chalk.bold.red(t`Failed to delete unused assets files`));
  }
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('image');
}
