import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex('seen').update('date', null).where('date', 0);
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
export async function down(knex: Knex): Promise<void> {}
