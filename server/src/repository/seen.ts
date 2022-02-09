import { Seen, seenColumns } from 'src/entity/seen';
import { TvEpisode } from 'src/entity/tvepisode';
import { tvEpisodeRepository } from 'src/repository/episode';
import { repository } from 'src/repository/repository';
import { knex } from 'src/dbconfig';

class SeenRepository extends repository<Seen>({
  tableName: 'seen',
  columnNames: seenColumns,
  primaryColumnName: 'id',
}) {
  async deleteForTvSeason(params: { userId: number; seasonId: number }) {
    const { seasonId, userId } = params;

    await knex.transaction(async (trx) => {
      const episodes = await knex<TvEpisode>(tvEpisodeRepository.tableName)
        .where('seasonId', seasonId)
        .transacting(trx);

      await knex<Seen>(this.tableName)
        .delete()
        .where({
          userId: userId,
        })
        .whereIn(
          'episodeId',
          episodes.map((episode) => episode.id)
        )
        .transacting(trx);
    });
  }
}

export const seenRepository = new SeenRepository();
