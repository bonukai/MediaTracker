import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('seen', (table) => {
    table.index(['userId', 'type', 'episodeId']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('seen', (table) => {
    table.dropIndex(['userId', 'type', 'episodeId']);
  });
}
