import { Knex } from 'knex';
import _ from 'lodash';

export async function up(knex: Knex): Promise<void> {
  await knex.schema
    .alterTable('notificationsHistory', (table) => {
      table.dropForeign('mediaItemId');
      table.dropForeign('episodeId');
    })
    .alterTable('notificationPlatformsCredentials', (table) => {
      table.dropForeign('userId');
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
    .alterTable('list', (table) => {
      table.dropForeign('userId');
    })
    .alterTable('episode', (table) => {
      table.dropForeign('tvShowId');
      table.dropForeign('seasonId');
    })
    .alterTable('season', (table) => {
      table.dropForeign('tvShowId');
    });

  const users = await knex<{
    id: number;
    name: string;
    password: string;
    admin?: boolean;
    publicReviews?: boolean;
    sendNotificationWhenStatusChanges?: boolean;
    sendNotificationWhenReleaseDateChanges?: boolean;
    sendNotificationWhenNumberOfSeasonsChanges?: boolean;
    sendNotificationForReleases?: boolean;
    sendNotificationForEpisodesReleases?: boolean;
    notificationPlatform?: string;
    hideOverviewForUnseenSeasons?: boolean;
    hideEpisodeTitleForUnseenEpisodes?: boolean;
  }>('user');

  const notificationPlatformsCredentials = await knex<{
    id: number;
    userId: number;
    platformName: string;
    name: string;
    value: string;
  }>('notificationPlatformsCredentials');

  await knex.schema.alterTable('user', (table) => {
    table.dropColumn('notificationPlatform');
    table.dropColumn('hideEpisodeTitleForUnseenEpisodes');
    table.dropColumn('hideOverviewForUnseenSeasons');
    table.text('preferencesJson');
  });

  await knex.schema.dropTable('notificationPlatformsCredentials');

  for (const user of users) {
    await knex('user').update(
      'preferencesJson',
      JSON.stringify({
        hideEpisodeTitleForUnseenEpisodes:
          user.hideEpisodeTitleForUnseenEpisodes,
        hideOverviewForUnseenSeasons: user.hideOverviewForUnseenSeasons,
        notificationPlatforms: _(notificationPlatformsCredentials)
          .filter((item) => item.userId === user.id)
          .groupBy((item) => item.platformName)
          .mapValues((values) =>
            values.reduce(
              (res, current) => ({
                ...res,
                [current.name]: current.value,
              }),
              {}
            )
          )
          .mapValues((credentials, platformName) => ({
            enabled: user.notificationPlatform === platformName,
            credentials: credentials,
          }))
          .value(),
      })
    );
  }

  await knex.schema
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
    });
}

export async function down(knex: Knex): Promise<void> {}
