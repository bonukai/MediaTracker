import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('seen', (table) => {
    table.string('type');
    table.index('type');
  });

  await knex('seen').where('action', 'started').update({
    type: 'progress',
    progress: 0,
    action: null,
  });

  await knex('seen').whereNull('type').update({
    type: 'seen',
    action: null,
  });

  await knex.schema.alterTable('seen', (table) => {
    table.string('type').notNullable().alter({ alterNullable: true });
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('seen', (table) => {
    table.dropColumn('type');
  });
}
