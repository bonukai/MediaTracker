import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema
    .alterTable('season', (table) => {
      table.double('deletedAt');
      table.index('deletedAt');
    })
    .alterTable('episode', (table) => {
      table.double('deletedAt');
      table.index('deletedAt');
    });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema
    .alterTable('listItem', (table) => {
      table.dropForeign('episodeId');
      table.dropForeign('seasonId');
    })
    .alterTable('image', (table) => {
      table.dropForeign('seasonId');
    })
    .alterTable('seen', (table) => {
      table.dropForeign('episodeId');
    })
    .alterTable('userRating', (table) => {
      table.dropForeign('seasonId');
      table.dropForeign('episodeId');
    })
    .alterTable('notificationsHistory', (table) => {
      table.dropForeign('episodeId');
    })
    .alterTable('episode', (table) => {
      table.dropForeign('seasonId');
    })
    .alterTable('season', (table) => {
      table.dropIndex('deletedAt');
      table.dropColumn('deletedAt');
    })
    .alterTable('episode', (table) => {
      table.dropIndex('deletedAt');
      table.dropColumn('deletedAt');
    })
    .alterTable('episode', (table) => {
      table.foreign('seasonId').references('id').inTable('season');
    })
    .alterTable('image', (table) => {
      table.foreign('seasonId').references('id').inTable('season');
    })
    .alterTable('seen', (table) => {
      table.foreign('episodeId').references('id').inTable('episode');
    })
    .alterTable('userRating', (table) => {
      table.foreign('seasonId').references('id').inTable('season');
      table.foreign('episodeId').references('id').inTable('episode');
    })
    .alterTable('notificationsHistory', (table) => {
      table.foreign('episodeId').references('id').inTable('episode');
    })
    .alterTable('listItem', (table) => {
      table.foreign('episodeId').references('id').inTable('episode');
      table.foreign('seasonId').references('id').inTable('season');
    });
}
