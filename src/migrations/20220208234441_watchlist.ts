import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('watchlist', (table) => {
    table.double('addedAt');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('watchlist', (table) => {
    table.dropColumn('addedAt');
  });
}
