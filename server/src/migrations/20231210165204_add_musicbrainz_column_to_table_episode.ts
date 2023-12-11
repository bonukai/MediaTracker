import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.table("episode", (table) => {
    table.string("musicBrainzId", 128);
  });
};

export async function down(knex: Knex): Promise<void> {
  await knex.schema.table("episode", (table) => {
    table.dropColumn("musicBrainzId");
  });
};
