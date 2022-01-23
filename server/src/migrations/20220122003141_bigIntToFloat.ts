import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.schema
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
            table.float('lastTimeUpdated').alter();
            table.float('lockedAt').alter();
        })
        .alterTable('season', (table) => {
            table.foreign('tvShowId').references('id').inTable('mediaItem');
        })
        .alterTable('episode', (table) => {
            table.foreign('tvShowId').references('id').inTable('mediaItem');
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
        })
        .alterTable('seen', (table) => {
            table.float('date').alter();
        })
        .alterTable('userRating', (table) => {
            table.float('date').alter();
        })
        .alterTable('notificationsHistory', (table) => {
            table.float('sendDate').alter();
        })
        .alterTable('sessionKey', (table) => {
            table.float('createdAt').alter();
        });
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema
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
            table.bigInteger('lastTimeUpdated').alter();
            table.bigInteger('lockedAt').alter();
        })
        .alterTable('season', (table) => {
            table.foreign('tvShowId').references('id').inTable('mediaItem');
        })
        .alterTable('episode', (table) => {
            table.foreign('tvShowId').references('id').inTable('mediaItem');
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
        })
        .alterTable('seen', (table) => {
            table.bigInteger('date').alter();
        })
        .alterTable('userRating', (table) => {
            table.bigInteger('date').alter();
        })
        .alterTable('notificationsHistory', (table) => {
            table.bigInteger('sendDate').alter();
        })
        .alterTable('sessionKey', (table) => {
            table.bigInteger('createdAt').alter();
        });
}
// a
