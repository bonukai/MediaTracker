import axios from 'axios';
import { createNotificationPlatform } from 'src/notifications/createNotificationPlatform';

export const ntfy = createNotificationPlatform({
  name: 'ntfy',
  credentialNames: <const>['topic', 'url', 'priority'],
  sendFunction: async (args) => {
    const { credentials, content } = args;

    await axios.post(
      new URL(credentials.topic, credentials.url || 'https://ntfy.sh').href,
      content.body.plainText,
      {
        headers: {
          Title: content.title,
          Priority: credentials.priority,
        },
      }
    );
  },
});
