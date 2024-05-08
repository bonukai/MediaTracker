import _ from 'lodash';
import { Database } from '../database.js';
import {
  ConfigurationJson,
  configurationJsonSchema,
  defaultConfiguration,
} from '../entity/configurationModel.js';

export const configurationRepository = {
  async get() {
    const res = await Database.knex('configuration').first();

    if (!res?.configurationJson) {
      throw new Error(`Missing configuration record`);
    }

    return configurationJsonSchema.parse(JSON.parse(res.configurationJson));
  },
  async update(configuration: Partial<ConfigurationJson>) {
    await Database.knex.transaction(async (trx) => {
      const res = await trx('configuration').first();

      if (!res) {
        throw new Error(`Missing configuration record`);
      }

      await trx('configuration').update({
        configurationJson: JSON.stringify(
          configurationJsonSchema.parse(
            _.merge(
              { ...defaultConfiguration },
              JSON.stringify(res.configurationJson || {}),
              configuration
            )
          )
        ),
      });
    });
  },
  async createIfDoesNotExists() {
    await Database.knex.transaction(async (trx) => {
      const existingConfiguration = await trx('configuration').first();

      if (existingConfiguration) {
        return;
      }

      await trx('configuration').insert({
        configurationJson: JSON.stringify(
          configurationJsonSchema.parse(defaultConfiguration)
        ),
      });
    });
  },
} as const;

export const getConfiguration = configurationRepository.get;
