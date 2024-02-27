import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('accessToken', (table) => {
    table.string('prefix').nullable();
  });
}

export async function down(knex: Knex): Promise<void> {}
