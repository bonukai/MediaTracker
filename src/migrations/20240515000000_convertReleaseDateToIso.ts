import { parseISO } from 'date-fns';
import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex('mediaItem').where('releaseDate', '').update('releaseDate', null);

  const mediaItemsWithReleaseDate =
    await knex('mediaItem').whereNotNull('releaseDate');

  for (const mediaItem of mediaItemsWithReleaseDate) {
    if (!mediaItem.releaseDate) {
      continue;
    }

    const newDate = parseISO(mediaItem.releaseDate);

    if (isNaN(newDate.getTime())) {
      await knex('mediaItem')
        .where('id', mediaItem.id)
        .update('releaseDate', null);
    }
    await knex('mediaItem')
      .where('id', mediaItem.id)
      .update('releaseDate', newDate.toISOString());
  }
}

export async function down(knex: Knex): Promise<void> {}
