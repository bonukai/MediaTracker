import { z } from 'zod';

import { FormattedNotification } from './formatNotification.js';

type NotificationPlatform<T> = {
  readonly credentialsSchema: z.Schema<T>;
  readonly name: string;
  readonly sendNotification: (args: {
    content: {
      title: string;
      body: FormattedNotification;
    };
    credentials: T;
  }) => Promise<void>;
};

export const createNotificationPlatform = <T>(
  impl: NotificationPlatform<T>
): NotificationPlatform<T> => {
  return {
    ...impl,
    async sendNotification(args: {
      content: {
        title: string;
        body: FormattedNotification;
      };
      credentials: T;
    }): Promise<void> {
      return impl.sendNotification({
        content: args.content,
        credentials: impl.credentialsSchema.parse(args.credentials),
      });
    },
  };
};
