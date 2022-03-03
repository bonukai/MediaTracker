import _ from 'lodash';

import { TvSeason, tvSeasonColumns } from 'src/entity/tvseason';
import { repository } from 'src/repository/repository';
import { knex } from 'src/dbconfig';

class TvSeasonRepository extends repository<TvSeason>({
  tableName: 'season',
  columnNames: tvSeasonColumns,
  primaryColumnName: 'id',
  booleanColumnNames: ['isSpecialSeason'],
  hasSoftDelete: true,
}) {
  public async withMissingPosters(seasonIdsWithPoster: number[]) {
    return await knex<TvSeason>(this.tableName)
      .whereNotIn('id', seasonIdsWithPoster)
      .whereNotNull('poster')
      .whereNot('poster', '');
  }
}

export const tvSeasonRepository = new TvSeasonRepository();
