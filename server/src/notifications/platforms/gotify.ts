import axios from 'axios';
import { createNotificationPlatform } from 'src/notifications/createNotificationPlatform';

export const gotify = createNotificationPlatform({
  name: 'gotify',
  credentialNames: <const>['url', 'token', 'priority'],
  sendFunction: async (args) => {
    const { credentials, content } = args;

    await axios.post(
      new URL('/message', credentials.url).href,
      {
        extras: {
          'client::display': {
            contentType: 'text/markdown',
          },
        },
        priority: Number(credentials.priority) || 5,
        message: content.body.markdown,
        title: content.title,
      },
      {
        headers: {
          'X-Gotify-Key': credentials.token,
        },
      }
    );
  },
});
