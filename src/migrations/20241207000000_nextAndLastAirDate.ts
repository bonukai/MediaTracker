import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('mediaItem', (table) => {
    table.string('nextAiringDate', 24).nullable();
    table.string('lastAiringDate', 24).nullable();

    table.index(['id', 'nextAiringDate']);
    table.index(['id', 'lastAiringDate']);
  });
}

export async function down(knex: Knex): Promise<void> {}
