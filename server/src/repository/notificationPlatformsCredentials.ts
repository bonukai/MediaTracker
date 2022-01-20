import _ from 'lodash';

import { NotificationPlatformsCredentials } from 'src/entity/notificationPlatformsCredentials';
import { NotificationPlatformsCredentialsType } from 'src/notifications/notifications';
import { repository } from 'src/repository/repository';

class NotificationPlatformsCredentialsRepository extends repository<NotificationPlatformsCredentials>(
    {
        tableName: 'notificationPlatformsCredentials',
        primaryColumnName: 'id',
    }
) {
    public async get(
        userId: number
    ): Promise<Partial<NotificationPlatformsCredentialsType>> {
        const credentials = await this.find({
            userId: userId,
        });

        return _(credentials)
            .groupBy((value) => value.platformName)
            .mapValues((value) =>
                _(value)
                    .keyBy((value) => value.name)
                    .mapValues((value) => value.value)
                    .value()
            )
            .value();
    }
}

export const notificationPlatformsCredentialsRepository =
    new NotificationPlatformsCredentialsRepository();
