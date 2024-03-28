import { z } from 'zod';

import { createNotificationPlatform } from '../notificationPlatform.js';

export const gotify = createNotificationPlatform({
  name: 'gotify',
  credentialsSchema: z.object({
    url: z.string().url(),
    token: z.string().min(1),
    priority: z.coerce.number().min(0).max(10).default(5).nullish(),
  }),
  async sendNotification(args) {
    const { credentials, content } = args;

    await fetch(new URL('/message', credentials.url).href, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Gotify-Key': credentials.token,
      },
      body: JSON.stringify({
        extras: {
          'client::display': {
            contentType: 'text/markdown',
          },
        },
        priority: credentials.priority,
        message: content.body.markdown,
        title: content.title,
      }),
    });
  },
});
