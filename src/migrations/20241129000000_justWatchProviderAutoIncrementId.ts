import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const justWatchAvailabilityData = await knex('justWatchAvailability');
  const justWatchProviderData = await knex('justWatchProvider');

  await knex.schema.dropTable('justWatchAvailability');
  await knex.schema.dropTable('justWatchProvider');

  await knex.schema.createTable('justWatchProvider', (table) => {
    table.increments('id').primary();
    table.string('externalLogoUrl');
    table.string('name');
    table.string('logo');

    table.index(['logo']);
  });

  await knex.schema.createTable('justWatchAvailability', (table) => {
    table.increments('id').primary();
    table.integer('providerId').references('id').inTable('justWatchProvider');
    table.integer('mediaItemId').references('id').inTable('mediaItem');
    table.string('type');
    table.string('country');
    table.integer('displayPriority');

    table.index(['mediaItemId']);
    table.index(['mediaItemId', 'providerId']);
  });

  await knex.batchInsert('justWatchProvider', justWatchProviderData, 100);

  await knex.batchInsert(
    'justWatchAvailability',
    justWatchAvailabilityData,
    100
  );
}

export async function down(knex: Knex): Promise<void> {}
