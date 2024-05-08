import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema
    .alterTable('sharedList', (table) => {
      table.dropForeign('listId');
      table.dropForeign('userId');
    })
    .alterTable('notificationsHistory', (table) => {
      table.dropForeign('mediaItemId');
      table.dropForeign('episodeId');
    })
    .alterTable('accessToken', (table) => {
      table.dropForeign('userId');
    })
    .alterTable('seen', (table) => {
      table.dropForeign('mediaItemId');
      table.dropForeign('episodeId');
      table.dropForeign('userId');
    })
    .alterTable('progress', (table) => {
      table.dropForeign('mediaItemId');
      table.dropForeign('episodeId');
      table.dropForeign('userId');
    })
    .alterTable('userRating', (table) => {
      table.dropForeign('mediaItemId');
      table.dropForeign('seasonId');
      table.dropForeign('episodeId');
      table.dropForeign('userId');
    })
    .alterTable('listItem', (table) => {
      table.dropForeign('episodeId');
      table.dropForeign('seasonId');
      table.dropForeign('mediaItemId');
      table.dropForeign('listId');
    })
    .alterTable('watchlist', (table) => {
      table.dropForeign('listId');
      table.dropForeign('userId');
    })
    .alterTable('list', (table) => {
      table.dropForeign('userId');
    })
    .alterTable('episode', (table) => {
      table.dropForeign('tvShowId');
      table.dropForeign('seasonId');
    })
    .alterTable('season', (table) => {
      table.dropForeign('tvShowId');
    })
    .alterTable('session', (table) => {
      table.dropForeign('userId');
    })
    .alterTable('justWatchAvailability', (table) => {
      table.dropForeign('providerId');
      table.dropForeign('mediaItemId');
    });

  await knex.schema.alterTable('mediaItem', (table) => {
    table
      .integer('upcomingEpisodeId')
      .references('id')
      .inTable('episode')
      .nullable();
    table
      .integer('lastAiredEpisodeId')
      .references('id')
      .inTable('episode')
      .nullable();
    table.integer('numberOfAiredEpisodes').nullable();
  });

  await knex.schema
    .alterTable('justWatchAvailability', (table) => {
      table.foreign('providerId').references('id').inTable('justWatchProvider');
      table.foreign('mediaItemId').references('id').inTable('mediaItem');
    })
    .alterTable('session', (table) => {
      table.foreign('userId').references('id').inTable('user');
    })
    .alterTable('season', (table) => {
      table.foreign('tvShowId').references('id').inTable('mediaItem');
    })
    .alterTable('episode', (table) => {
      table.foreign('tvShowId').references('id').inTable('mediaItem');
      table.foreign('seasonId').references('id').inTable('season');
    })
    .alterTable('notificationsHistory', (table) => {
      table.foreign('mediaItemId').references('id').inTable('mediaItem');
      table.foreign('episodeId').references('id').inTable('episode');
    })
    .alterTable('list', (table) => {
      table.foreign('userId').references('id').inTable('user');
    })
    .alterTable('listItem', (table) => {
      table.foreign('episodeId').references('id').inTable('episode');
      table.foreign('seasonId').references('id').inTable('season');
      table.foreign('mediaItemId').references('id').inTable('mediaItem');
      table.foreign('listId').references('id').inTable('list');
    })
    .alterTable('userRating', (table) => {
      table.foreign('episodeId').references('id').inTable('episode');
      table.foreign('seasonId').references('id').inTable('season');
      table.foreign('mediaItemId').references('id').inTable('mediaItem');
      table.foreign('userId').references('id').inTable('user');
    })
    .alterTable('seen', (table) => {
      table.foreign('episodeId').references('id').inTable('episode');
      table.foreign('mediaItemId').references('id').inTable('mediaItem');
      table.foreign('userId').references('id').inTable('user');
    })
    .alterTable('accessToken', (table) => {
      table.foreign('userId').references('id').inTable('user');
    })
    .alterTable('progress', (table) => {
      table.foreign('mediaItemId').references('id').inTable('mediaItem');
      table.foreign('episodeId').references('id').inTable('episode');
      table.foreign('userId').references('id').inTable('user');
    })
    .alterTable('watchlist', (table) => {
      table.foreign('listId').references('id').inTable('list');
      table.foreign('userId').references('id').inTable('user');
    })
    .alterTable('sharedList', (table) => {
      table.foreign('listId').references('id').inTable('list');
      table.foreign('userId').references('id').inTable('user');
    });
}

export async function down(knex: Knex): Promise<void> {}
