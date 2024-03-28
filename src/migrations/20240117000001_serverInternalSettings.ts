import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const sessionKey = await knex<{ id: number; key: string }>(
    'sessionKey'
  ).first();

  await knex.schema
    .dropTable('sessionKey')
    .createTable('serverInternalSettings', (table) => {
      table.increments('id').primary();
      table.text('settingsJson').notNullable();
    });

  if (sessionKey) {
    await knex<{ id: number; settingsJson: string }>(
      'serverInternalSettings'
    ).insert({
      id: 1,
      settingsJson: JSON.stringify({
        sessionKey: sessionKey,
      }),
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const serverInternalSettings = await knex<{
    id: number;
    settingsJson: string;
  }>('serverInternalSettings').first();

  await knex.schema
    .createTable('sessionKey', (table) => {
      table.increments('id').primary();
      table.text('key').notNullable();
      table.bigInteger('createdAt').notNullable();
    })
    .dropTable('serverInternalSettings');

  await knex<{ id: number; key: string }>('sessionKey').insert({
    id: 1,
    key: JSON.parse(serverInternalSettings!.settingsJson).sessionKey,
  });
}
