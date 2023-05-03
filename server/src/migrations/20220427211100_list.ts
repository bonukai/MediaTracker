import { Knex } from 'knex';
import { fixItemsWithInvalidMediaItemId } from 'src/migrations/20220312002700_mediaItemSlug';
import { randomSlugId, toSlug } from 'src/slug';

export async function up(knex: Knex): Promise<void> {
  await fixItemsWithInvalidMediaItemId(knex);

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
    .alterTable('userRating', (table) => {
      table.dropForeign('mediaItemId');
      table.dropForeign('seasonId');
      table.dropForeign('episodeId');
      table.dropForeign('userId');
    })
    .alterTable('watchlist', (table) => {
      table.dropForeign('mediaItemId');
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

  await knex.schema
    .alterTable('list', (table) => {
      table.string('slug');
      table.integer('rank');
      table.boolean('allowComments');
      table.boolean('displayNumbers');

      table.unique(['userId', 'rank']);
      table.unique(['userId', 'name']);
      table.index('slug');
    })
    .alterTable('listItem', (table) => {
      table.integer('rank');
      table.string('type');

      table.unique(['listId', 'rank']);
    });

  const lists = await knex('list');

  for (const list of lists) {
    const slug = toSlug(list.name);
    let listIndex = 0;

    await knex('list').update({
      slug: knex.raw(
        `(CASE WHEN (${knex('list')
          .count()
          .where('userId', list.userId)
          .where('slug', slug)
          .toQuery()}) = 0  THEN '${slug}' ELSE '${slug}-${randomSlugId()}' END)`
      ),
      rank: listIndex++,
      sortBy: 'recently-watched',
      sortOrder: 'desc',
    });

    const listItems = await knex('listItem').where('listId', list.id);

    let listItemIndex = 0;

    for (const listItem of listItems) {
      await knex('listItem')
        .update('rank', listItemIndex++)
        .where('id', listItem.id);
    }
  }

  await knex.schema
    .alterTable('list', (table) => {
      table.integer('rank').notNullable().alter({
        alterNullable: true,
      });
      table.string('slug').notNullable().alter({
        alterNullable: true,
      });
      table.string('sortBy').notNullable().alter({ alterNullable: true });
      table.string('sortOrder').notNullable().alter({ alterNullable: true });
      table.unique(['userId', 'slug']);
    })
    .alterTable('listItem', (table) => {
      table.integer('rank').notNullable().alter({
        alterNullable: true,
      });
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
    .alterTable('watchlist', (table) => {
      table.foreign('mediaItemId').references('id').inTable('mediaItem');
      table.foreign('userId').references('id').inTable('user');
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
    .alterTable('userRating', (table) => {
      table.dropForeign('mediaItemId');
      table.dropForeign('seasonId');
      table.dropForeign('episodeId');
      table.dropForeign('userId');
    })
    .alterTable('watchlist', (table) => {
      table.dropForeign('mediaItemId');
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

  await knex.schema
    .alterTable('list', (table) => {
      table.dropUnique(['userId', 'rank']);
      table.dropUnique(['userId', 'slug']);
      table.dropUnique(['userId', 'name']);
      table.dropIndex('slug');

      table.dropColumn('slug');
      table.dropColumn('rank');
      table.dropColumn('allowComments');
      table.dropColumn('displayNumbers');
      table.string('sortBy').nullable().alter({ alterNullable: true });
      table.string('sortOrder').nullable().alter({ alterNullable: true });
    })
    .alterTable('listItem', (table) => {
      table.dropUnique(['listId', 'rank']);

      table.dropColumn('rank');
      table.dropColumn('type');
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
    .alterTable('watchlist', (table) => {
      table.foreign('mediaItemId').references('id').inTable('mediaItem');
      table.foreign('userId').references('id').inTable('user');
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
    });
}
