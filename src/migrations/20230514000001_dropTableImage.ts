import { Knex } from 'knex';
import _ from 'lodash';

export async function up(knex: Knex): Promise<void> {
  await knex.schema
    .alterTable('image', (table) => {
      table.dropForeign('mediaItemId');
      table.dropForeign('seasonId');
    })
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

  await knex.schema.alterTable('mediaItem', (table) => {
    table.renameColumn('poster', 'externalPosterUrl');
    table.renameColumn('backdrop', 'externalBackdropUrl');
    table.text('posterId');
    table.text('backdropId');
  });

  await knex.schema.alterTable('season', (table) => {
    table.renameColumn('poster', 'externalPosterUrl');
    table.text('posterId');
  });

  const images = await knex<{
    id: string;
    mediaItemId: number;
    seasonId?: number;
    type: 'poster' | 'backdrop';
  }>('image');

  await Promise.all(
    images.map(async (image) => {
      if (image.seasonId == null) {
        if (image.type === 'poster') {
          await knex('mediaItem')
            .update('posterId', image.id)
            .where('id', image.mediaItemId);
        } else if (image.type === 'backdrop') {
          await knex('mediaItem')
            .update('backdropId', image.id)
            .where('id', image.mediaItemId);
        }
      } else if (image.type === 'poster') {
        await knex('season')
          .update('posterId', image.id)
          .where('id', image.seasonId);
      }
    })
  );

  await knex.schema.dropTable('image');

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
    .alterTable('notificationPlatformsCredentials', (table) => {
      table.foreign('userId').references('id').inTable('user');
    })
    .alterTable('progress', (table) => {
      table.foreign('mediaItemId').references('id').inTable('mediaItem');
      table.foreign('episodeId').references('id').inTable('episode');
      table.foreign('userId').references('id').inTable('user');
    });
}

export async function down(knex: Knex): Promise<void> {
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

  await knex.schema.createTable('image', (table) => {
    table.string('id').unique().primary();
    table.integer('mediaItemId').notNullable();
    table.integer('seasonId');
    table.string('type').notNullable();

    table.index('mediaItemId');
    table.index('seasonId');
    table.index('type');
  });

  const mediaItemPosters = await knex<{
    id: number;
    posterId: string;
  }>('mediaItem').whereNotNull('posterId');

  const mediaItemBackdrops = await knex<{
    id: string;
    backdropId: string;
  }>('mediaItem').whereNotNull('backdropId');

  const seasonPosters = await knex<{
    id: number;
    tvShowId: number;
    posterId: string;
  }>('season').whereNotNull('posterId');

  await Promise.all([
    ...mediaItemPosters.map(async (item) => {
      await knex('image').insert({
        id: item.posterId,
        mediaItemId: item.id,
        type: 'poster',
      });
    }),
    ...mediaItemBackdrops.map(async (item) => {
      await knex('image').insert({
        id: item.backdropId,
        mediaItemId: item.id,
        type: 'backdrop',
      });
    }),
    ...seasonPosters.map(async (item) => {
      await knex('image').insert({
        id: item.posterId,
        mediaItemId: item.tvShowId,
        seasonId: item.id,
        type: 'poster',
      });
    }),
  ]);

  await knex.schema.alterTable('mediaItem', (table) => {
    table.renameColumn('externalPosterUrl', 'poster');
    table.renameColumn('externalBackdropUrl', 'backdrop');
    table.dropColumn('posterId');
    table.dropColumn('backdropId');
  });

  await knex.schema.alterTable('season', (table) => {
    table.renameColumn('externalPosterUrl', 'poster');
    table.dropColumn('posterId');
  });

  await knex.schema
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
    .alterTable('notificationPlatformsCredentials', (table) => {
      table.foreign('userId').references('id').inTable('user');
    })
    .alterTable('progress', (table) => {
      table.foreign('mediaItemId').references('id').inTable('mediaItem');
      table.foreign('episodeId').references('id').inTable('episode');
      table.foreign('userId').references('id').inTable('user');
    });
}
