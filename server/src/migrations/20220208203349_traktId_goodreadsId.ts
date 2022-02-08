import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.schema
        .alterTable('image', (table) => {
            table.dropForeign('mediaItemId');
            table.dropForeign('seasonId');
        })
        .alterTable('seen', (table) => {
            table.dropForeign('mediaItemId');
            table.dropForeign('seasonId');
            table.dropForeign('episodeId');
        })
        .alterTable('userRating', (table) => {
            table.dropForeign('mediaItemId');
            table.dropForeign('seasonId');
            table.dropForeign('episodeId');
        })
        .alterTable('watchlist', (table) => {
            table.dropForeign('mediaItemId');
        })
        .alterTable('notificationsHistory', (table) => {
            table.dropForeign('mediaItemId');
            table.dropForeign('episodeId');
        })
        .alterTable('episode', (table) => {
            table.dropForeign('tvShowId');
            table.dropForeign('seasonId');
        })
        .alterTable('season', (table) => {
            table.dropForeign('tvShowId');
        })
        .alterTable('mediaItem', (table) => {
            table.integer('goodreadsId');
            table.integer('traktId');
        })
        .alterTable('season', (table) => {
            table.foreign('tvShowId').references('id').inTable('mediaItem');
        })
        .alterTable('episode', (table) => {
            table.foreign('tvShowId').references('id').inTable('mediaItem');
            table.foreign('seasonId').references('id').inTable('season');
        })
        .alterTable('image', (table) => {
            table.foreign('mediaItemId').references('id').inTable('mediaItem');
            table.foreign('seasonId').references('id').inTable('season');
        })
        .alterTable('seen', (table) => {
            table.foreign('mediaItemId').references('id').inTable('mediaItem');
            table.foreign('seasonId').references('id').inTable('season');
            table.foreign('episodeId').references('id').inTable('episode');
        })
        .alterTable('userRating', (table) => {
            table.foreign('mediaItemId').references('id').inTable('mediaItem');
            table.foreign('seasonId').references('id').inTable('season');
            table.foreign('episodeId').references('id').inTable('episode');
        })
        .alterTable('watchlist', (table) => {
            table.foreign('mediaItemId').references('id').inTable('mediaItem');
        })
        .alterTable('notificationsHistory', (table) => {
            table.foreign('mediaItemId').references('id').inTable('mediaItem');
            table.foreign('episodeId').references('id').inTable('episode');
        });
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema
        .alterTable('image', (table) => {
            table.dropForeign('mediaItemId');
            table.dropForeign('seasonId');
        })
        .alterTable('seen', (table) => {
            table.dropForeign('mediaItemId');
            table.dropForeign('seasonId');
            table.dropForeign('episodeId');
        })
        .alterTable('userRating', (table) => {
            table.dropForeign('mediaItemId');
            table.dropForeign('seasonId');
            table.dropForeign('episodeId');
        })
        .alterTable('watchlist', (table) => {
            table.dropForeign('mediaItemId');
        })
        .alterTable('notificationsHistory', (table) => {
            table.dropForeign('mediaItemId');
            table.dropForeign('episodeId');
        })
        .alterTable('episode', (table) => {
            table.dropForeign('tvShowId');
            table.dropForeign('seasonId');
        })
        .alterTable('season', (table) => {
            table.dropForeign('tvShowId');
        })
        .alterTable('mediaItem', (table) => {
            table.dropColumn('goodreadsId');
            table.dropColumn('traktId');
        })
        .alterTable('season', (table) => {
            table.foreign('tvShowId').references('id').inTable('mediaItem');
        })
        .alterTable('episode', (table) => {
            table.foreign('tvShowId').references('id').inTable('mediaItem');
            table.foreign('seasonId').references('id').inTable('season');
        })
        .alterTable('image', (table) => {
            table.foreign('mediaItemId').references('id').inTable('mediaItem');
            table.foreign('seasonId').references('id').inTable('season');
        })
        .alterTable('seen', (table) => {
            table.foreign('mediaItemId').references('id').inTable('mediaItem');
            table.foreign('seasonId').references('id').inTable('season');
            table.foreign('episodeId').references('id').inTable('episode');
        })
        .alterTable('userRating', (table) => {
            table.foreign('mediaItemId').references('id').inTable('mediaItem');
            table.foreign('seasonId').references('id').inTable('season');
            table.foreign('episodeId').references('id').inTable('episode');
        })
        .alterTable('watchlist', (table) => {
            table.foreign('mediaItemId').references('id').inTable('mediaItem');
        })
        .alterTable('notificationsHistory', (table) => {
            table.foreign('mediaItemId').references('id').inTable('mediaItem');
            table.foreign('episodeId').references('id').inTable('episode');
        });
}
