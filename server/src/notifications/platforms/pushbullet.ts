import axios from 'axios';
import { createNotificationPlatform } from 'src/notifications/createNotificationPlatform';

export const Pushbullet = createNotificationPlatform({
  name: 'Pushbullet',
  credentialName: 'token',
  sendFunction: async (args) => {
    const { credentials, content } = args;

    await axios.post(
      'https://api.pushbullet.com/v2/pushes',
      {
        body: content.body.plainText,
        title: content.title,
        type: 'note',
      },
      {
        headers: {
          'Access-Token': credentials.token,
        },
      }
    );
  },
});
