import { Knex } from 'knex';
import _ from 'lodash';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('configuration', (table) => {
    table.string('igdbClientId');
    table.string('igdbClientSecret');
  });

  const res = await knex('metadataProviderCredentials');

  const { IGDB } = _.groupBy(res, 'providerName');

  if (IGDB) {
    const { CLIENT_ID, CLIENT_SECRET } = _(IGDB)
      .keyBy('name')
      .mapValues((value) => value.value)
      .value();

    if (CLIENT_ID && CLIENT_SECRET) {
      const alteredRows = await knex<{
        igdbClientId?: string;
        igdbClientSecret?: string;
      }>('configuration').update({
        igdbClientId: CLIENT_ID,
        igdbClientSecret: CLIENT_SECRET,
      });

      if (alteredRows === 0) {
        await knex<{
          igdbClientId?: string;
          igdbClientSecret?: string;
        }>('configuration').insert({
          igdbClientId: CLIENT_ID,
          igdbClientSecret: CLIENT_SECRET,
        });
      }
    }
  }

  await knex.schema.dropTable('metadataProviderCredentials');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.createTable('metadataProviderCredentials', (table) => {
    table.increments('id').primary();
    table.text('providerName').notNullable();
    table.text('name').notNullable();
    table.text('value').notNullable();
    table.index('providerName');
  });

  const { igdbClientId, igdbClientSecret } =
    (await knex<{
      igdbClientId?: string;
      igdbClientSecret?: string;
    }>('configuration').first()) || {};

  if (igdbClientId && igdbClientSecret) {
    await knex('metadataProviderCredentials').insert([
      {
        providerName: 'IGDB',
        name: 'CLIENT_ID',
        value: igdbClientId,
      },
      {
        providerName: 'IGDB',
        name: 'CLIENT_SECRET',
        value: igdbClientSecret,
      },
    ]);
  }

  await knex.schema.alterTable('configuration', (table) => {
    table.dropColumn('igdbClientId');
    table.dropColumn('igdbClientSecret');
  });
}
