import axios from 'axios';
import sharp from 'sharp';
import { createNotificationPlatform } from 'src/notifications/createNotificationPlatform';

export const Pushsafer = createNotificationPlatform({
  name: 'Pushsafer',
  credentialName: 'key',
  sendFunction: async (args) => {
    const { message, title, imagePath, credentials } = args;

    const params = new URLSearchParams({
      k: credentials.key,
      t: title,
      m: message,
    });

    if (imagePath) {
      const image = await sharp(imagePath).resize(400).toBuffer();
      params.append('p', 'data:image/jpeg;base64,' + image.toString('base64'));
    }

    await axios.post('https://www.pushsafer.com/api', params);
  },
});
