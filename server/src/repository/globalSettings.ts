import chalk from 'chalk';
import _ from 'lodash';
import { Database } from 'src/dbconfig';
import { Configuration } from 'src/entity/configuration';
import { logger } from 'src/logger';
import { repository } from 'src/repository/repository';

class ConfigurationRepository extends repository<Configuration>({
  tableName: 'configuration',
  primaryColumnName: 'id',
  booleanColumnNames: ['enableRegistration'],
}) {
  public async update(value: Partial<Configuration>) {
    GlobalConfiguration.update(value);

    return await Database.knex.transaction(async (trx) => {
      const currentConfigEntry = await trx('configuration').first();
      const currentConfig = JSON.parse(currentConfigEntry.configurationJson);

      const res = _.merge(currentConfig, value);

      await trx('configuration').update('configurationJson', res);

      return res;
    });
  }

  public async get(): Promise<Configuration> {
    const configEntry = await Database.knex('configuration').first();

    if (!configEntry || !configEntry.configurationJson) {
      return;
    }

    return JSON.parse(configEntry.configurationJson);
  }

  public async create(value: Partial<Configuration>) {
    await Database.knex.transaction(async (trx) => {
      await trx('configuration').delete();
      await trx('configuration').insert({
        configurationJson: JSON.stringify(value),
      });
    });
  }
}

export const configurationRepository = new ConfigurationRepository();

export class GlobalConfiguration {
  static _configuration: Configuration = { enableRegistration: true };
  static listeners: {
    key: keyof Omit<Configuration, 'id'>;
    handler: (value: unknown, previousValue: unknown) => Promise<void> | void;
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
            await handler(value[key], previousConfiguration[key]);
          } catch (error) {
            logger.error(error);
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
        : never,
      previousValue: Configuration extends {
        [K in T]?: infer A;
      }
        ? A
        : never
    ) => Promise<void> | void
  ) {
    this.listeners.push({ key: key, handler: handler });
  }
}
