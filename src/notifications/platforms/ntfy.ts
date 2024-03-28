import { z } from 'zod';

import { createNotificationPlatform } from '../notificationPlatform.js';

export const ntfy = createNotificationPlatform({
  name: 'ntfy',
  credentialsSchema: z.object({
    url: z.string().url().nullish(),
    topic: z.string().min(1),
    priority: z.number().min(1).max(5).nullish(),
  }),
  async sendNotification(args) {
    const { credentials, content } = args;

    await fetch(
      new URL(credentials.topic, credentials.url || 'https://ntfy.sh').href,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'plain/text',
          Title: content.title,
          ...(typeof credentials.priority === 'number'
            ? { Priority: credentials.priority.toString() }
            : {}),
        },
        body: content.body.plainText,
      }
    );
  },
});
