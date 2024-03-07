import { z } from 'zod';

import { createNotificationPlatform } from '../notificationPlatform.js';

export const APP_TOKEN = 'ax32fzevhit7iwkm3fk18uw1i2ooyv';

export const Pushover = createNotificationPlatform({
  name: 'Pushover',
  credentialsSchema: z.object({
    key: z.string().min(1),
  }),
  async sendNotification(args) {
    const { credentials, content } = args;

    const params = new URLSearchParams({
      message: content.body.html,
      title: content.title,
      user: credentials.key,
      token: APP_TOKEN,
      html: '1',
    });

    await fetch('https://api.pushbullet.com/v2/pushes?' + params, {
      method: 'POST',
    });
  },
});
