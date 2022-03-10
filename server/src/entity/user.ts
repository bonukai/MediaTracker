import _ from 'lodash';
import { NotificationPlatformsCredentialsType } from 'src/notifications/notifications';

export type User = {
  id: number;
  name: string;
  slug: string;
  password: string;
  admin?: boolean;
  publicReviews?: boolean;
  sendNotificationWhenStatusChanges?: boolean;
  sendNotificationWhenReleaseDateChanges?: boolean;
  sendNotificationWhenNumberOfSeasonsChanges?: boolean;
  sendNotificationForReleases?: boolean;
  sendNotificationForEpisodesReleases?: boolean;
  notificationPlatform?: keyof NotificationPlatformsCredentialsType;
  hideOverviewForUnseenSeasons?: boolean;
  hideEpisodeTitleForUnseenEpisodes?: boolean;
};

export const userNonSensitiveColumns = <const>[
  'id',
  'name',
  'slug',
  'admin',
  'publicReviews',
  'sendNotificationWhenStatusChanges',
  'sendNotificationWhenReleaseDateChanges',
  'sendNotificationWhenNumberOfSeasonsChanges',
  'sendNotificationForReleases',
  'sendNotificationForEpisodesReleases',
  'notificationPlatform',
  'hideOverviewForUnseenSeasons',
  'hideEpisodeTitleForUnseenEpisodes',
];

export const userColumns = <const>[...userNonSensitiveColumns, 'password'];
