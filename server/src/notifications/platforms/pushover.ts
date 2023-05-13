import axios from 'axios';
import { createNotificationPlatform } from 'src/notifications/createNotificationPlatform';

const APP_TOKEN = 'ax32fzevhit7iwkm3fk18uw1i2ooyv';

export const Pushover = createNotificationPlatform({
  name: 'Pushover',
  credentialName: 'key',
  sendFunction: async (args) => {
    const { credentials, content } = args;

    const params = new URLSearchParams({
      message: content.body.html,
      title: content.title,
      user: credentials.key,
      token: APP_TOKEN,
      html: '1',
    });

    await axios.post('https://api.pushover.net/1/messages.json', params);
  },
});
