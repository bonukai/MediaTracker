import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex('mediaItem').where('imdbId', '').update('imdbId', null);
  await knex('mediaItem')
    .where('openlibraryId', '')
    .update('openlibraryId', null);
  await knex('mediaItem').where('audibleId', '').update('audibleId', null);

  await knex('episode').where('imdbId', '').update('imdbId', null);

  return knex.schema
    .alterTable('mediaItem', (table) => {
      table.unique(['tmdbId', 'mediaType']);
      table.unique(['imdbId', 'mediaType']);
      table.unique(['tvmazeId', 'mediaType']);
      table.unique(['traktId', 'mediaType']);
      table.unique(['igdbId', 'mediaType']);
      table.unique(['openlibraryId', 'mediaType']);
      table.unique(['audibleId', 'mediaType']);
      table.unique(['goodreadsId', 'mediaType']);
    })
    .alterTable('season', (table) => {
      table.unique(['tmdbId']);
    })
    .alterTable('episode', (table) => {
      table.unique(['tmdbId']);
      table.unique(['imdbId']);
    });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema
    .alterTable('mediaItem', (table) => {
      table.dropUnique(['tmdbId', 'mediaType']);
      table.dropUnique(['imdbId', 'mediaType']);
      table.dropUnique(['tvmazeId', 'mediaType']);
      table.dropUnique(['traktId', 'mediaType']);
      table.dropUnique(['igdbId', 'mediaType']);
      table.dropUnique(['openlibraryId', 'mediaType']);
      table.dropUnique(['audibleId', 'mediaType']);
      table.dropUnique(['goodreadsId', 'mediaType']);
    })
    .alterTable('season', (table) => {
      table.dropUnique(['tmdbId']);
    })
    .alterTable('episode', (table) => {
      table.dropUnique(['tmdbId']);
      table.dropUnique(['imdbId']);
    });
}
