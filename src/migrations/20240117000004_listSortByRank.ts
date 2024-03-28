import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex('list').where('sortBy', 'rank').update('sortBy', 'listed');
}

export async function down(knex: Knex): Promise<void> {}
