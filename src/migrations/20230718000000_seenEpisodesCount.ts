import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('seenEpisodesCount', (table) => {
    table.integer('id').primary();
    table.integer('userId').references('id').inTable('user').notNullable();
    table
      .integer('mediaItemId')
      .references('id')
      .inTable('mediaItem')
      .notNullable();
    table.integer('seenEpisodesCount').notNullable();

    table.index(['userId', 'mediaItemId']);
    table.unique(['userId', 'mediaItemId']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('seenEpisodesCount');
}
