import { Knex } from 'knex';

import { fixItemsWithInvalidMediaItemId } from './20220312002700_mediaItemSlug.js';

export async function up(knex: Knex): Promise<void> {
  await fixItemsWithInvalidMediaItemId(knex);

  await knex('seen').update('date', null).where('date', 0);
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
export async function down(knex: Knex): Promise<void> {}
