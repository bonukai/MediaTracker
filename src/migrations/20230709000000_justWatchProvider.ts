import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('justWatchProvider', (table) => {
    table.integer('id').primary();
    table.string('externalLogoUrl');
    table.string('name');
    table.string('logo');

    table.index(['logo']);
  });

  await knex.schema.createTable('justWatchAvailability', (table) => {
    table.integer('id').primary();
    table.integer('providerId').references('id').inTable('justWatchProvider');
    table.integer('mediaItemId').references('id').inTable('mediaItem');
    table.string('type');
    table.string('country');
    table.integer('displayPriority');

    table.index(['mediaItemId']);
    table.index(['mediaItemId', 'providerId']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('justWatchAvailability');
  await knex.schema.dropTable('justWatchProvider');
}
