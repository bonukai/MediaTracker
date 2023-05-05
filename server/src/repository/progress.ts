import { repository } from 'src/repository/repository';
import { Progress, progressColumns } from 'src/entity/progress';

class ProgressRepository extends repository<Progress>({
  tableName: 'progress',
  columnNames: progressColumns,
  primaryColumnName: 'id',
}) {}

export const progressRepository = new ProgressRepository();
