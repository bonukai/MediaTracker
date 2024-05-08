import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex('list')
    .where('sortBy', 'my-rating')
    .update('sortBy', 'user-rating');
}

export async function down(knex: Knex): Promise<void> {}
