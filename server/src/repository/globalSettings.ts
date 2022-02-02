import { Configuration } from 'src/entity/configuration';
import { repository } from 'src/repository/repository';

class ConfigurationRepository extends repository<Configuration>({
    tableName: 'configuration',
    primaryColumnName: 'id',
    booleanColumnNames: ['enableRegistration'],
}) {
    public update(value: Partial<Configuration>): Promise<void> {
        PrivateGlobalConfiguration.update(value);
        return super.update(value);
    }
}

export const configurationRepository = new ConfigurationRepository();

class PrivateGlobalConfiguration {
    static _configuration: Configuration = { enableRegistration: true };
    static listeners: {
        key: keyof Omit<Configuration, 'id'>;
        handler: (value: unknown) => void;
    }[] = [];

    public static update(value: Partial<Configuration>) {
        PrivateGlobalConfiguration._configuration = {
            ...PrivateGlobalConfiguration._configuration,
            ...value,
        };

        value &&
            this.listeners.forEach(
                ({ key, handler }) => key in value && handler(value[key])
            );
    }

    public static get(): Configuration {
        return PrivateGlobalConfiguration._configuration;
    }

    public static subscribe(
        key: keyof Omit<Configuration, 'id'>,
        handler: (value: unknown) => void
    ) {
        this.listeners.push({ key: key, handler: handler });
    }
}

export class GlobalConfiguration {
    public static get configuration() {
        return PrivateGlobalConfiguration._configuration;
    }

    public static subscribe<T extends keyof Omit<Configuration, 'id'>>(
        key: T,
        handler: (
            value: Configuration extends {
                [K in T]: infer A;
            }
                ? A
                : never
        ) => void
    ) {
        return PrivateGlobalConfiguration.subscribe(key, handler);
    }
}
