import axios from 'axios';
import { createNotificationPlatform } from 'src/notifications/createNotificationPlatform';

export const Discord = createNotificationPlatform({
  name: 'Discord',
  credentialNames: <const>['url'],
  sendFunction: async (args) => {
    const { credentials, content } = args;

    await axios.post(new URL(credentials.url).href, {
      content: content.body.markdown,
      username: content.title,
    });
  },
});
