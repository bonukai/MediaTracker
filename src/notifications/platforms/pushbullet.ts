import { z } from 'zod';

import { createNotificationPlatform } from '../notificationPlatform.js';

export const Pushbullet = createNotificationPlatform({
  name: 'Pushbullet',
  credentialsSchema: z.object({
    token: z.string().nonempty(),
  }),
  async sendNotification(args) {
    const { credentials, content } = args;

    await fetch('https://api.pushbullet.com/v2/pushes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Access-Token': credentials.token,
      },
      body: JSON.stringify({
        body: content.body.plainText,
        title: content.title,
        type: 'note',
      }),
    });
  },
});
