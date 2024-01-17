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

  await knex.schema.alterTable('list', (table) => {
    table.dropUnique(['userId', 'rank']);
    table.dropColumn('rank');
  });

  await knex.schema.alterTable('listItem', (table) => {
    table.dropUnique(['listId', 'rank']);
    table.dropColumn('rank');
  });

  await knex('list').update('sortBy', 'recently-added').where('sortBy', 'rank');

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
    });
}

export async function down(knex: Knex): Promise<void> {
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

  await knex.schema.alterTable('list', (table) => {
    table.integer('rank');
  });

  await knex.schema.alterTable('listItem', (table) => {
    table.integer('rank');
  });

  const users = await knex<{ id: number }>('user');

  for (const user of users) {
    const lists = await knex('list')
      .where('userId', user.id)
      .orderBy('id', 'asc');

    await Promise.all(
      lists.map(async (list, index) => {
        await knex('list').update('rank', index).where('id', list.id);

        const listItems = await knex('listItem').where('listId', list.id);

        await Promise.all(
          listItems.map((listItem, index) =>
            knex('listItem').update('rank', index).where('id', listItem.id)
          )
        );
      })
    );
  }

  await knex.schema.alterTable('list', (table) => {
    table.dropNullable('rank');
    table.unique(['userId', 'rank']);
  });

  await knex.schema.alterTable('listItem', (table) => {
    table.dropNullable('rank');
    table.unique(['listId', 'rank']);
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
    });
}
