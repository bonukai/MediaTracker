import { Knex } from 'knex';
import _ from 'lodash';

export async function up(knex: Knex): Promise<void> {
  const configuration = await knex('configuration').first();

  await knex.schema.alterTable('configuration', (table) => {
    table.dropColumn('enableRegistration');
    table.dropColumn('tmdbLang');
    table.dropColumn('audibleLang');
    table.dropColumn('serverLang');
    table.dropColumn('igdbClientId');
    table.dropColumn('igdbClientSecret');
    table.text('configurationJson');
  });

  if (configuration) {
    await knex('configuration').update(
      'configurationJson',
      JSON.stringify({
        enableRegistration: configuration.enableRegistration,
        tmdbLang: configuration.tmdbLang,
        audibleLang: configuration.audibleLang,
        serverLang: configuration.serverLang,
        igdbClientId: configuration.igdbClientId,
        igdbClientSecret: configuration.igdbClientSecret,
      })
    );
  }
}

export async function down(knex: Knex): Promise<void> {
  const configurationEntry = await knex('configuration').first();

  await knex.schema.alterTable('configuration', (table) => {
    table.boolean('enableRegistration');
    table.string('tmdbLang');
    table.string('audibleLang');
    table.string('serverLang');
    table.string('igdbClientId');
    table.string('igdbClientSecret');
    table.dropColumn('configurationJson');
  });

  if (configurationEntry) {
    const configuration = JSON.parse(configurationEntry.configurationJson);
    
    await knex('configuration').update({
      enableRegistration: configuration.enableRegistration,
      tmdbLang: configuration.tmdbLang,
      audibleLang: configuration.audibleLang,
      serverLang: configuration.serverLang,
      igdbClientId: configuration.igdbClientId,
      igdbClientSecret: configuration.igdbClientSecret,
    });
  }

  await knex.schema.alterTable('configuration', (table) => {
    table.dropNullable('enableRegistration');
  });
}
