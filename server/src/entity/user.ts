import _ from 'lodash';
import { NotificationPlatformsCredentialsType } from 'src/notifications/notifications';

export type User = {
    id: number;
    name: string;
    password: string;
    admin?: boolean;
    publicReviews?: boolean;
    sendNotificationWhenStatusChanges?: boolean;
    sendNotificationWhenReleaseDateChanges?: boolean;
    sendNotificationWhenNumberOfSeasonsChanges?: boolean;
    sendNotificationForReleases?: boolean;
    sendNotificationForEpisodesReleases?: boolean;
    notificationPlatform?: keyof NotificationPlatformsCredentialsType;
};

export const userNonSensitiveColumns = <const>[
    'id',
    'name',
    'admin',
    'publicReviews',
    'sendNotificationWhenStatusChanges',
    'sendNotificationWhenReleaseDateChanges',
    'sendNotificationWhenNumberOfSeasonsChanges',
    'sendNotificationForReleases',
    'sendNotificationForEpisodesReleases',
    'notificationPlatform',
];

export const userColumns = <const>[...userNonSensitiveColumns, 'password'];
