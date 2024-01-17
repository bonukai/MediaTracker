import { Knex } from 'knex';
import _ from 'lodash';

// TODO: Refactor progress from multi row to single row. Move game progress to seen history?. Add unique constraint

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('message', (table) => {
    table.increments('id').primary();
    table.integer('userId').references('id').inTable('user').notNullable();
    table.boolean('read').notNullable();
    table.text('message').notNullable();
    table.double('createdAt').notNullable();

    table.index(['userId']);
    table.index(['userId', 'read']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('message');
}
