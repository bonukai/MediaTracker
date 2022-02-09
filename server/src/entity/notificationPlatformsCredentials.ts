export type NotificationPlatformsCredentials = {
  id: number;
  userId: number;
  platformName: string;
  name: string;
  value: string;
};

export const notificationPlatformsCredentialsColumns = <const>[
  'id',
  'userId',
  'platformName',
  'name',
  'value',
];
