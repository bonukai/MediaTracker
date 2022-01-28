import { Configuration } from 'src/entity/configuration';
import { repository } from 'src/repository/repository';
import { changeLanguage } from 'i18next';

class ConfigurationRepository extends repository<Configuration>({
    tableName: 'configuration',
    primaryColumnName: 'id',
    booleanColumnNames: ['enableRegistration'],
}) {
    public async findOne(
        where?: Partial<Configuration>
    ): Promise<Configuration> {
        const res = await super.findOne(where);
        PrivateGlobalConfiguration.update(res);
        return res;
    }

    public update(value: Partial<Configuration>): Promise<void> {
        PrivateGlobalConfiguration.update(value);
        return super.update(value);
    }
}

export const configurationRepository = new ConfigurationRepository();

class PrivateGlobalConfiguration {
    static _configuration: Configuration = { enableRegistration: true };

    public static update(value: Partial<Configuration>) {
        PrivateGlobalConfiguration._configuration = {
            ...PrivateGlobalConfiguration._configuration,
            ...value,
        };

        changeLanguage(value?.serverLang);
    }

    public static get(): Configuration {
        return PrivateGlobalConfiguration._configuration;
    }
}

export const GlobalConfiguration = PrivateGlobalConfiguration.get;
