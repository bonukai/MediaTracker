import _ from 'lodash';

import { UserResponse } from '../entity/userModel.js';
import { logger } from '../logger.js';
import { FormattedNotification } from './formatNotification.js';
import { Discord } from './platforms/discord.js';
import { gotify } from './platforms/gotify.js';
import { ntfy } from './platforms/ntfy.js';
import { Pushbullet } from './platforms/pushbullet.js';
import { Pushover } from './platforms/pushover.js';
import { Pushsafer } from './platforms/pushsafer.js';

const platforms = <const>[
  gotify,
  Discord,
  Pushbullet,
  Pushover,
  Pushsafer,
  ntfy,
];

export const notificationPlatformsSchemas = platforms.map((item) => ({
  platformName: item.name,
  credentialSchema: item.credentialsSchema,
}));

const platformsByName = _.keyBy(
  platforms.map((platform) => platform),
  (item) => item.name
);

export const notificationPlatforms = {
  async sendToUser(args: {
    user: UserResponse;
    content: {
      title: string;
      body: FormattedNotification;
    };
  }) {
    const { user, content } = args;

    logger.debug(
      `sending notification to user ${user.name}: "${content.body.plainText}"`
    );

    await Promise.all(
      Object.entries(user.preferences.notificationPlatforms)
        .filter(([_, item]) => item?.enabled && item.credentials)
        .map(([name, item]) =>
          platformsByName[name].sendNotification({
            content: content,
            credentials: item?.credentials as any,
          })
        )
    );
  },
} as const;
