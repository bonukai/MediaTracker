import axios from 'axios';
import FormData from 'form-data';
import sharp from 'sharp';
import { createNotificationPlatform } from 'src/notifications/createNotificationPlatform';

const APP_TOKEN = 'ax32fzevhit7iwkm3fk18uw1i2ooyv';

export const Pushover = createNotificationPlatform({
  name: 'Pushover',
  credentialName: 'key',
  sendFunction: async (args) => {
    const { message, title, imagePath, credentials } = args;

    if (imagePath) {
      sharp(imagePath).resize(20).toBuffer();

      const data = new FormData();
      data.append('message', message);
      data.append('title', title);
      data.append('user', credentials.key);
      data.append('token', APP_TOKEN);
      data.append('attachment', sharp(imagePath).resize(600), {
        filename: 'poster.jpg',
      });

      await axios.post('https://api.pushover.net/1/messages.json', data, {
        headers: data.getHeaders(),
      });
    } else {
      const params = new URLSearchParams({
        message: message,
        title: title,
        user: credentials.key,
        token: APP_TOKEN,
      });

      await axios.post('https://api.pushover.net/1/messages.json', params);
    }
  },
});
