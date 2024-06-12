import { z } from 'zod';

import { FormattedNotification } from './formatNotification.js';

type NotificationPlatform<T, U extends string> = {
  readonly credentialsSchema: z.Schema<T>;
  readonly name: U;
  readonly sendNotification: (args: {
    content: {
      title: string;
      body: FormattedNotification;
    };
    credentials: T;
  }) => Promise<void>;
};

export const createNotificationPlatform = <T, U extends string>(
  impl: NotificationPlatform<T, U>
): NotificationPlatform<T, U> => {
  return {
    ...impl,
    async sendNotification(args: {
      content: {
        title: string;
        body: FormattedNotification;
      };
      credentials: T;
    }): Promise<void> {
      return await impl.sendNotification({
        content: args.content,
        credentials: impl.credentialsSchema.parse(args.credentials),
      });
    },
  };
};
