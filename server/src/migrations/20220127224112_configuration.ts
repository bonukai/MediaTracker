import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('configuration', (table) => {
    table.string('tmdbLang');
    table.string('audibleLang');
    table.string('serverLang');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('configuration', (table) => {
    table.dropColumn('tmdbLang');
    table.dropColumn('audibleLang');
    table.dropColumn('serverLang');
  });
}
