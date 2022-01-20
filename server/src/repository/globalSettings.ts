import { Configuration } from 'src/entity/configuration';
import { repository } from 'src/repository/repository';

export const configurationRepository = new (repository<Configuration>({
    tableName: 'configuration',
    primaryColumnName: 'id',
}))();
