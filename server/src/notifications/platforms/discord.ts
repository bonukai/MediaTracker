import axios from 'axios';
import { createNotificationPlatform } from 'src/notifications/createNotificationPlatform';

export const Discord = createNotificationPlatform({
  name: 'Discord',
  credentialNames: <const>['url'],
  sendFunction: async (args) => {
    const { messageMarkdown, message, title, credentials } = args;

    await axios.post(new URL(credentials.url).href, {
      content: messageMarkdown || message,
      username: title,
    });
  },
});
