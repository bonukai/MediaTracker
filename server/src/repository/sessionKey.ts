import { SessionKey } from 'src/entity/sessionKey';
import { repository } from 'src/repository/repository';

export const sessionKeyRepository = new (repository<SessionKey>({
  tableName: 'sessionKey',
  primaryColumnName: 'id',
}))();
