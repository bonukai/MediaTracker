import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.schema
        .createTable('user', (table) => {
            table.increments('id').primary();
            table.text('name').notNullable();
            table.text('password').notNullable();
            table.boolean('admin');
            table.boolean('publicReviews');
            table.boolean('sendNotificationWhenStatusChanges');
            table.boolean('sendNotificationWhenReleaseDateChanges');
            table.boolean('sendNotificationWhenNumberOfSeasonsChanges');
            table.boolean('sendNotificationForReleases');
            table.boolean('sendNotificationForEpisodesReleases');
            table.string('notificationPlatform');
            table.index('name');
        })
        .createTable('accessToken', (table) => {
            table.increments('id').primary();
            table
                .integer('userId')
                .notNullable()
                .references('id')
                .inTable('user');
            table.string('token').notNullable();
            table.text('description').notNullable();
            table.index('userId');
            table.index('token');
        })
        .createTable('mediaItem', (table) => {
            table.increments('id').primary();
            table.integer('tmdbId');
            table.string('imdbId');
            table.integer('tvmazeId');
            table.integer('igdbId');
            table.string('openlibraryId');
            table.string('mediaType');
            table.integer('numberOfSeasons');
            table.string('status');
            table.string('platform');
            table.text('title').notNullable();
            table.text('originalTitle');
            table.text('poster');
            table.text('backdrop');
            table.decimal('tmdbRating');
            table.string('releaseDate');
            table.text('overview');
            table.bigInteger('lastTimeUpdated').notNullable();
            table.string('source').notNullable();
            table.string('network');
            table.text('url');
            table.integer('runtime');
            table.text('genres');
            table.string('developer');
            table.string('audibleId');
            table.text('authors');
            table.text('narrators');
            table.string('language');
            table.boolean('needsDetails');
            table.bigInteger('lockedAt');
            table.index('title');
        })
        .createTable('season', (table) => {
            table.increments('id').primary();
            table.integer('tmdbId');
            table.text('title').notNullable();
            table.text('description');
            table.integer('seasonNumber').notNullable();
            table.integer('numberOfEpisodes').notNullable();
            table.boolean('isSpecialSeason').notNullable();
            table.string('poster');
            table.string('releaseDate');
            table
                .integer('tvShowId')
                .notNullable()
                .references('id')
                .inTable('mediaItem');
            table.index('tvShowId');
        })
        .createTable('episode', (table) => {
            table.increments('id').primary();
            table.text('title').notNullable();
            table.text('description');
            table.integer('episodeNumber').notNullable();
            table.integer('seasonNumber').notNullable();
            table.integer('seasonAndEpisodeNumber').notNullable();
            table.boolean('isSpecialEpisode').notNullable();
            table.string('releaseDate');
            table
                .integer('tvShowId')
                .notNullable()
                .references('id')
                .inTable('mediaItem');
            table
                .integer('seasonId')
                .notNullable()
                .references('id')
                .inTable('season');
            table.integer('tmdbId');
            table.string('imdbId');
            table.integer('runtime');
            table.index('seasonAndEpisodeNumber');
            table.index('tvShowId');
        })
        .createTable('seen', (table) => {
            table.increments('id').primary();
            table.bigInteger('date').notNullable();
            table
                .integer('mediaItemId')
                .notNullable()
                .references('id')
                .inTable('mediaItem');
            table.integer('seasonId').references('id').inTable('season');
            table.integer('episodeId').references('id').inTable('episode');
            table
                .integer('userId')
                .references('id')
                .inTable('user')
                .notNullable();
            table.index('date');
            table.index('mediaItemId');
            table.index('episodeId');
            table.index('userId');
        })
        .createTable('userRating', (table) => {
            table.increments('id').primary();
            table.bigInteger('date').notNullable();
            table
                .integer('userId')
                .notNullable()
                .references('id')
                .inTable('user');
            table.integer('rating');
            table.text('review');
            table
                .integer('mediaItemId')
                .notNullable()
                .references('id')
                .inTable('mediaItem');
            table.integer('seasonId').references('id').inTable('season');
            table.integer('episodeId').references('id').inTable('episode');
            table.index('userId');
            table.index('mediaItemId');
            table.index('seasonId');
            table.index('episodeId');
        })
        .createTable('watchlist', (table) => {
            table.increments('id').primary();
            table
                .integer('userId')
                .notNullable()
                .references('id')
                .inTable('user');
            table
                .integer('mediaItemId')
                .notNullable()
                .references('id')
                .inTable('mediaItem');
            table.index('userId');
            table.index('mediaItemId');
        })
        .createTable('session', (table) => {
            table.text('sid').primary();
            table.text('session').notNullable();
        })
        .createTable('metadataProviderCredentials', (table) => {
            table.increments('id').primary();
            table.text('providerName').notNullable();
            table.text('name').notNullable();
            table.text('value').notNullable();
            table.index('providerName');
        })
        .createTable('notificationPlatformsCredentials', (table) => {
            table.increments('id').primary();
            table
                .integer('userId')
                .notNullable()
                .references('id')
                .inTable('user');
            table.text('platformName').notNullable();
            table.text('name').notNullable();
            table.text('value').notNullable();
            table.index('platformName');
        })

        .createTable('notificationsHistory', (table) => {
            table.increments('id').primary();
            table
                .integer('mediaItemId')
                .notNullable()
                .references('id')
                .inTable('mediaItem');
            table.integer('episodeId').references('id').inTable('episode');
            table.bigInteger('sendDate').notNullable();
            table.index('mediaItemId');
            table.index('episodeId');
            table.index('sendDate');
        })
        .createTable('sessionKey', (table) => {
            table.increments('id').primary();
            table.text('key').notNullable();
            table.bigInteger('createdAt').notNullable();
        })
        .createTable('configuration', (table) => {
            table.increments('id').primary();
            table.boolean('enableRegistration').notNullable();
        });
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema
        .dropTable('configuration')
        .dropTable('sessionKey')
        .dropTable('notificationsHistory')
        .dropTable('notificationPlatformsCredentials')
        .dropTable('metadataProviderCredentials')
        .dropTable('session')
        .dropTable('watchlist')
        .dropTable('userRating')
        .dropTable('seen')
        .dropTable('episode')
        .dropTable('season')
        .dropTable('mediaItem')
        .dropTable('accessToken')
        .dropTable('user');
}
