import _ from 'lodash';
import { nanoid } from 'nanoid';

import { Database } from '../database.js';
import {
  ServerInternalSettingsJson,
  serverInternalSettingsJsonSchema,
} from '../entity/serverSettingsModel.js';

export const serverInternalSettingsRepository = {
  async get() {
    return await Database.knex.transaction(async (trx) => {
      const res = await trx('serverInternalSettings').first();

      if (!res) {
        const defaultSettings: ServerInternalSettingsJson = {
          sessionKey: {
            key: nanoid(1024),
            createdAt: Date.now(),
          },
        };

        await trx('serverInternalSettings').insert({
          id: 1,
          settingsJson: JSON.stringify(defaultSettings),
        });

        return defaultSettings;
      } else {
        return serverInternalSettingsJsonSchema.parse(
          JSON.parse(res.settingsJson)
        );
      }
    });
  },
  async update(settings: Partial<ServerInternalSettingsJson>) {
    await Database.knex.transaction(async (trx) => {
      const res = await trx('serverInternalSettings').first();

      if (!res) {
        throw new Error(`Missing serverInternalSettings record`);
      }

      await trx('serverInternalSettings').update({
        settingsJson: JSON.stringify(
          serverInternalSettingsJsonSchema.parse(
            _.merge(JSON.parse(res.settingsJson), settings)
          )
        ),
      });
    });
  },
} as const;
