import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('seen', (table) => {
    table.double('progress');
    table.double('duration');
    table.double('startedAt');
    table.string('action');
    table.dropColumn('seasonId');
  });

  await knex<{
    id?: number;
    date: number;
    mediaItemId: number;
    episodeId?: number;
    progress?: number;
    duration?: number;
    startedAt?: number;
    action?: 'watched' | 'started' | 'progress';
    userId: number;
  }>('seen').update({
    action: 'watched',
  });

  await knex<{
    id?: number;
    date: number;
    mediaItemId: number;
    episodeId?: number;
    progress?: number;
    duration?: number;
    startedAt?: number;
    action?: 'watched' | 'started' | 'progress';
    userId: number;
  }>('seen')
    .whereNotNull('episodeId')
    .update(
      'duration',
      knex('episode')
        .select(knex.raw('runtime * 60 * 1000'))
        .where('id', knex.raw('??', ['seen.episodeId']))
    );

  await knex<{
    id?: number;
    date: number;
    mediaItemId: number;
    episodeId?: number;
    progress?: number;
    duration?: number;
    startedAt?: number;
    action?: 'watched' | 'started' | 'progress';
    userId: number;
  }>('seen')
    .whereNotNull('episodeId')
    .whereNull('duration')
    .update(
      'duration',
      knex('mediaItem')
        .select(knex.raw('runtime * 60 * 1000'))
        .where('id', knex.raw('??', ['seen.mediaItemId']))
    );

  await knex<{
    id?: number;
    date: number;
    mediaItemId: number;
    episodeId?: number;
    progress?: number;
    duration?: number;
    startedAt?: number;
    action?: 'watched' | 'started' | 'progress';
    userId: number;
  }>('seen')
    .whereNull('episodeId')
    .update(
      'duration',
      knex('mediaItem')
        .select(knex.raw('runtime * 60 * 1000'))
        .where('id', knex.raw('??', ['seen.mediaItemId']))
    );
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('seen', (table) => {
    table.dropColumn('progress');
    table.dropColumn('duration');
    table.dropColumn('startedAt');
    table.dropColumn('action');
    table.integer('seasonId').references('id').inTable('season');
  });
}
