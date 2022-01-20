import { AccessToken } from 'src/entity/accessToken';
import { repository } from 'src/repository/repository';

export const accessTokenRepository = new (repository<AccessToken>({
    tableName: 'accessToken',
    primaryColumnName: 'id',
}))();
