import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('accessToken', (table) => {
    table.string('scope').nullable();
    table.float('createdAt').nullable();
    table.float('lastUsedAt').nullable();
    table.string('createdBy').nullable();
  });

  await knex('accessToken').update('createdAt', Date.now());
  await knex('accessToken').update('createdBy', 'user');

  await knex.schema.alterTable('accessToken', (table) => {
    table.dropNullable('createdAt');
    table.dropNullable('createdBy');
  });
}

export async function down(knex: Knex): Promise<void> {}
