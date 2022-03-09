import { Seen, seenColumns } from 'src/entity/seen';
import { TvEpisode } from 'src/entity/tvepisode';
import { tvEpisodeRepository } from 'src/repository/episode';
import { repository } from 'src/repository/repository';
import { Database } from 'src/dbconfig';

class SeenRepository extends repository<Seen>({
  tableName: 'seen',
  columnNames: seenColumns,
  primaryColumnName: 'id',
}) {
  async deleteForTvSeason(params: { userId: number; seasonId: number }) {
    const { seasonId, userId } = params;

    await Database.knex.transaction(async (trx) => {
      const episodes = await Database.knex<TvEpisode>(
        tvEpisodeRepository.tableName
      )
        .where('seasonId', seasonId)
        .transacting(trx);

      await Database.knex<Seen>(this.tableName)
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
