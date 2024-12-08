import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('hasBeenSeen', (table) => {
    table.integer('userId').references('id').inTable('user').notNullable();
    table
      .integer('mediaItemId')
      .references('id')
      .inTable('mediaItem')
      .notNullable();

    table.primary(['userId', 'mediaItemId']);
  });

  await knex
    .insert((db: Knex.QueryBuilder) =>
      db
        .from('seen')
        .leftJoin('mediaItem', 'mediaItem.id', 'seen.mediaItemId')
        .where('mediaType', '<>', 'tv')
        .distinct(['userId', 'mediaItemId'])
    )
    .into('hasBeenSeen');

  await knex
    .insert((db: Knex.QueryBuilder) =>
      db
        .from('mediaItem')
        .where('mediaType', 'tv')
        .leftJoin(
          'seenEpisodesCount',
          'mediaItem.id',
          'seenEpisodesCount.mediaItemId'
        )
        .where('seenEpisodesCount', 'numberOfAiredEpisodes')
        .select('userId', 'mediaItemId')
    )
    .into('hasBeenSeen');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('hasBeenSeen');
}
