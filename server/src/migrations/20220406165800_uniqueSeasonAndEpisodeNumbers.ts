import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema
    .alterTable('season', (table) => {
      table.unique(['tvShowId', 'seasonNumber']);
    })
    .alterTable('episode', (table) => {
      table.unique(['tvShowId', 'seasonNumber', 'episodeNumber']);
    });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema
    .alterTable('season', (table) => {
      table.dropUnique(['tvShowId', 'seasonNumber']);
    })
    .alterTable('episode', (table) => {
      table.dropUnique(['tvShowId', 'seasonNumber', 'episodeNumber']);
    });
}
