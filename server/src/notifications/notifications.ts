import _ from 'lodash';
import { t } from '@lingui/macro';

import { gotify } from 'src/notifications/platforms/gotify';
import { Discord } from 'src/notifications/platforms/discord';
import { ntfy } from 'src/notifications/platforms/ntfy';
import { Pushbullet } from 'src/notifications/platforms/pushbullet';
import { Pushover } from 'src/notifications/platforms/pushover';
import { Pushsafer } from 'src/notifications/platforms/pushsafer';
import { notificationPlatformsCredentialsRepository } from 'src/repository/notificationPlatformsCredentials';
import { userRepository } from 'src/repository/user';
import { FormattedNotification } from 'src/notifications/notificationFormatter';

const platforms = <const>[
  gotify,
  Discord,
  Pushbullet,
  Pushover,
  Pushsafer,
  ntfy,
];
export class Notifications {
  private static readonly platformsByName = _.keyBy(
    platforms,
    (platform) => platform.name
  );

  public static send = async (args: {
    userId: number;
    message: FormattedNotification;
  }): Promise<void> => {
    const { userId, message } = args;

    const user = await userRepository.findOne({ id: userId });

    if (!user.notificationPlatform) {
      return;
    }

    const credentials = await notificationPlatformsCredentialsRepository.get(
      userId
    );

    const platform = this.platformsByName[user.notificationPlatform];

    if (!platform) {
      throw new Error(t`Platform ${user.notificationPlatform} does not exist`);
    }

    await this.sendNotification(user.notificationPlatform, {
      message: message,
      credentials: credentials[user.notificationPlatform],
    });
  };

  public static sendNotification = async <
    T extends keyof NotificationPlatformsCredentialsType
  >(
    platformName: T,
    args: {
      message: FormattedNotification;
      credentials: NotificationPlatformsCredentialsType[T];
    }
  ): Promise<void> => {
    const platform = this.platformsByName[platformName];

    if (!platform) {
      throw new Error(t`Platform ${platformName} does not exist`);
    }

    await platform.sendFunction({
      content: {
        title: 'MediaTracker',
        body: args.message,
      },
      credentials: args.credentials as never,
    });
  };
}

export type NotificationPlatformsCredentialsType = {
  [K in Property<
    NotificationPlatformsCredentialsArrayType[number],
    'platformName'
  >]: Property<
    Extract<
      NotificationPlatformsCredentialsArrayType[number],
      { platformName: K }
    >,
    'credentials'
  >;
};

export type NotificationPlatformsResponseType =
  NotificationPlatformsCredentialsArrayType[number];

type NotificationPlatformsCredentialsArrayType =
  ToNotificationPlatformsCredentialsArrayType<typeof platforms>;

type Property<
  T extends Record<string, unknown>,
  Name extends keyof T
> = T extends { [Key in Name]: infer P } ? P : never;

type ToNotificationPlatformsCredentialsArrayType<
  Input extends ReadonlyArray<unknown>,
  Result extends ReadonlyArray<unknown> = []
> = Input extends readonly []
  ? Result
  : Input extends readonly [infer First, ...infer Rest]
  ? ToNotificationPlatformsCredentialsArrayType<
      Rest,
      [...Result, TransformNotificationPlatform<First>]
    >
  : Result;

type TransformNotificationPlatform<NotificationPlatform> =
  NotificationPlatform extends {
    name: infer PlatformName;
    credentialNames: infer Credentials;
    credentialName: infer CredentialName;
  }
    ? Credentials extends readonly []
      ? CredentialName extends string
        ? {
            platformName: PlatformName;
            credentials: Record<CredentialName, string>;
          }
        : never
      : Credentials extends ReadonlyArray<string>
      ? {
          platformName: PlatformName;
          credentials: Record<Credentials[number], string>;
        }
      : never
    : never;
