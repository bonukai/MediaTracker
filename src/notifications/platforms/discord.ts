import { z } from 'zod';

import { createNotificationPlatform } from '../notificationPlatform.js';

export const Discord = createNotificationPlatform({
  name: 'Discord',
  credentialsSchema: z.object({
    url: z.string(),
  }),
  async sendNotification(args) {
    const { credentials, content } = args;

    await fetch(new URL(credentials.url).href, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: content.body.markdown,
        username: content.title,
      }),
    });
  },
});
