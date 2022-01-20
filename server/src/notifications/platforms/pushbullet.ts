import axios from 'axios';
import FormData from 'form-data';
import sharp from 'sharp';
import { createNotificationPlatform } from 'src/notifications/createNotificationPlatform';

export const Pushbullet = createNotificationPlatform({
    name: 'Pushbullet',
    credentialName: 'token',
    sendFunction: async (args) => {
        const { message, title, imagePath, credentials } = args;

        if (imagePath) {
            const uploadRequestRes = await axios.post<{
                upload_url: string;
                file_url: string;
            }>(
                'https://api.pushbullet.com/v2/upload-request',
                {
                    file_name: 'poster.jpg',
                    file_type: 'image/jpeg',
                },
                {
                    headers: {
                        'Access-Token': credentials.token,
                    },
                }
            );

            const data = new FormData();
            data.append('file', sharp(imagePath).resize(400));

            const uploadRes = await axios.post(
                uploadRequestRes.data.upload_url,
                data,
                {
                    headers: data.getHeaders(),
                }
            );

            await axios.post(
                'https://api.pushbullet.com/v2/pushes',
                {
                    body: message,
                    title: title,
                    type: 'file',
                    file_name: 'poster.jpg',
                    file_type: 'image/jpeg',
                    file_url: uploadRequestRes.data.file_url,
                },
                {
                    headers: {
                        'Access-Token': credentials.token,
                    },
                }
            );
        } else {
            await axios.post(
                'https://api.pushbullet.com/v2/pushes',
                {
                    body: message,
                    title: title,
                    type: 'note',
                },
                {
                    headers: {
                        'Access-Token': credentials.token,
                    },
                }
            );
        }
    },
});
