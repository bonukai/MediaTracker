import _ from 'lodash';

import { TvSeason, tvSeasonColumns } from 'src/entity/tvseason';
import { repository } from 'src/repository/repository';

class TvSeasonRepository extends repository<TvSeason>({
  tableName: 'season',
  columnNames: tvSeasonColumns,
  primaryColumnName: 'id',
  booleanColumnNames: ['isSpecialSeason'],
}) {}

export const tvSeasonRepository = new TvSeasonRepository();
