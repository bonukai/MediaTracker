import axios from 'axios';
import { createNotificationPlatform } from 'src/notifications/createNotificationPlatform';

export const Pushsafer = createNotificationPlatform({
  name: 'Pushsafer',
  credentialName: 'key',
  sendFunction: async (args) => {
    const { credentials, content } = args;

    const params = new URLSearchParams({
      k: credentials.key,
      m: content.body.BBCode,
      t: content.title,
    });

    await axios.post('https://www.pushsafer.com/api', params);
  },
});
