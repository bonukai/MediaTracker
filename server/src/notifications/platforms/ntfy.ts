import axios from 'axios';
import { createNotificationPlatform } from 'src/notifications/createNotificationPlatform';

export const ntfy = createNotificationPlatform({
    name: 'ntfy',
    credentialNames: <const>['topic', 'url', 'priority'],
    sendFunction: async (args) => {
        const { credentials, message, title } = args;

        await axios.post(
            new URL(credentials.topic, credentials.url || 'https://ntfy.sh')
                .href,
            message,
            {
                headers: {
                    Title: title,
                    Priority: credentials.priority,
                },
            }
        );
    },
});
