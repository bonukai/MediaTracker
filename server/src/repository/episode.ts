import { knex } from 'src/dbconfig';
import { TvEpisode, tvEpisodeColumns } from 'src/entity/tvepisode';
import { repository } from 'src/repository/repository';

class EpisodeRepository extends repository<TvEpisode>({
  tableName: 'episode',
  columnNames: tvEpisodeColumns,
  primaryColumnName: 'id',
  booleanColumnNames: ['isSpecialEpisode'],
  hasSoftDelete: true,
}) {
  public async create(value: Partial<TvEpisode>) {
    return await super.create({
      ...value,
      seasonAndEpisodeNumber: value.seasonNumber * 1000 + value.episodeNumber,
    } as unknown);
  }

  public async createMany(values: Partial<TvEpisode>[]) {
    return await super.createMany(
      values.map((value) => ({
        ...value,
        seasonAndEpisodeNumber: value.seasonNumber * 1000 + value.episodeNumber,
      }))
    );
  }
}

export const tvEpisodeRepository = new EpisodeRepository();
