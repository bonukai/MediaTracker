import { z } from 'zod';

import { createNotificationPlatform } from '../notificationPlatform.js';

export const Pushsafer = createNotificationPlatform({
  name: 'Pushsafer',
  credentialsSchema: z.object({
    key: z.string().nonempty(),
  }),
  async sendNotification(args) {
    const { credentials, content } = args;

    const params = new URLSearchParams({
      k: credentials.key,
      m: content.body.BBCode,
      t: content.title,
    });

    await fetch('https://www.pushsafer.com/api?' + params, {
      method: 'POST',
    });
  },
});
