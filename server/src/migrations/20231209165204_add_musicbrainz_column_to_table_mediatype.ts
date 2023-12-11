import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.table("mediaItem", (table) => {
    table.string("musicBrainzId", 128);
  });
};

export async function down(knex: Knex): Promise<void> {
  await knex.schema.table("mediaItem", (table) => {
    table.dropColumn("musicBrainzId");
  });
};
