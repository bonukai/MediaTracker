import chalk from 'chalk';
import _ from 'lodash';
import { Configuration } from 'src/entity/configuration';
import { repository } from 'src/repository/repository';

class ConfigurationRepository extends repository<Configuration>({
    tableName: 'configuration',
    primaryColumnName: 'id',
    booleanColumnNames: ['enableRegistration'],
}) {
    public async update(value: Partial<Configuration>) {
        GlobalConfiguration.update(value);
        return await super.update(value);
    }
}

export const configurationRepository = new ConfigurationRepository();

export class GlobalConfiguration {
    static _configuration: Configuration = { enableRegistration: true };
    static listeners: {
        key: keyof Omit<Configuration, 'id'>;
        handler: (value: unknown) => Promise<void> | void;
    }[] = [];

    public static update(value: Partial<Configuration>) {
        const previousConfiguration = _.cloneDeep(this._configuration);

        this._configuration = {
            ...this._configuration,
            ...value,
        };

        value &&
            this.listeners.forEach(async ({ key, handler }) => {
                if (key in value && value[key] !== previousConfiguration[key]) {
                    try {
                        await handler(value[key]);
                    } catch (error) {
                        console.log(chalk.bold.red(error));
                    }
                }
            });
    }

    public static get(): Configuration {
        return this._configuration;
    }

    public static get configuration() {
        return this._configuration;
    }

    public static set configuration(value: Configuration) {
        this._configuration = value;
    }

    public static subscribe<T extends keyof Omit<Configuration, 'id'>>(
        key: T,
        handler: (
            value: Configuration extends {
                [K in T]?: infer A;
            }
                ? A
                : never
        ) => Promise<void> | void
    ) {
        this.listeners.push({ key: key, handler: handler });
    }
}
