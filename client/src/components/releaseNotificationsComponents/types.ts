import { RouterOutput } from '../../utils/trpc';

export type ReleaseNotificationPlatformName =
  RouterOutput['user']['get']['notificationPlatforms'][number]['name'];

export type ReleaseNotificationPlatformCredentials<
  P extends ReleaseNotificationPlatformName,
> = Extract<
  RouterOutput['user']['get']['notificationPlatforms'][number],
  { name: P }
>['credentials'];
