import { Knex } from 'knex';
import _ from 'lodash';

export async function up(knex: Knex): Promise<void> {
  await knex('session').delete();

  await knex.schema.alterTable('session', (table) => {
    table.dropColumn('session');
    table.integer('userId').references('id').inTable('user');
    table.double('expiresAt');
  });
}

export async function down(knex: Knex): Promise<void> {}
