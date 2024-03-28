import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('episode', (table) => {
    table.dropIndex(['seasonAndEpisodeNumber']);
    table.index(['tvShowId', 'seasonAndEpisodeNumber']);
    table.boolean('seasonFinale').nullable();
    table.boolean('midSeasonFinale').nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('episode', (table) => {
    table.index(['seasonAndEpisodeNumber']);
    table.dropIndex(['tvShowId', 'seasonAndEpisodeNumber']);
    table.dropColumn('seasonFinale');
    table.dropColumn('midSeasonFinale');
  });
}
