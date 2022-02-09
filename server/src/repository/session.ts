import { Session } from 'src/entity/session';
import { repository } from 'src/repository/repository';

export const sessionRepository = new (repository<Session>({
  tableName: 'session',
  primaryColumnName: 'sid',
}))();
