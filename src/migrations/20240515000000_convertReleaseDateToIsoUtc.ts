import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex('mediaItem').where('releaseDate', '').update('releaseDate', null);

  const mediaItemsWithReleaseDate =
    await knex('mediaItem').whereNotNull('releaseDate');

  for (const mediaItem of mediaItemsWithReleaseDate) {
    try {
      await knex('mediaItem')
        .where('id', mediaItem.id)
        .update('releaseDate', new Date(mediaItem.releaseDate!).toISOString());
    } catch {
      await knex('mediaItem')
        .where('id', mediaItem.id)
        .update('releaseDate', null);
    }
  }
}

export async function down(knex: Knex): Promise<void> {}
