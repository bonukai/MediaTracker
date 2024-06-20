import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex('mediaItem')
    .whereNotNull('runtime')
    .update('runtime', knex.raw('runtime * 60 * 1000'));

  await knex('episode')
    .whereNotNull('runtime')
    .update('runtime', knex.raw('runtime * 60 * 1000'));
}

export async function down(knex: Knex): Promise<void> {}
