import { Knex } from 'knex';
import _ from 'lodash';
import { nanoid } from 'nanoid';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('user', (table) => {
    table.string('notificationPlatformsJson').nullable();
  });

  const users = await knex('user').whereNotNull('preferencesJson');

  for (const user of users) {
    const preferences = JSON.parse(user.preferencesJson || '{}');

    await knex('user')
      .update({
        preferencesJson: JSON.stringify(_.omit(preferences, 'preferencesJson')),
        notificationPlatformsJson: JSON.stringify(
          [...Object.entries(preferences.notificationPlatforms)].map(
            ([platformName, value]: [string, unknown]) => ({
              id: nanoid(),
              name: platformName,
              credentials:
                value && typeof value === 'object' && 'credentials' in value
                  ? value.credentials
                  : undefined,
            })
          )
        ),
      })
      .where('id', user.id);
  }
}

export async function down(knex: Knex): Promise<void> {}
