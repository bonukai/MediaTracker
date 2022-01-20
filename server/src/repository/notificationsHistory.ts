import {
    NotificationsHistory,
    notificationsHistoryColumns,
} from 'src/entity/notificationsHistory';
import { repository } from 'src/repository/repository';

export const notificationsHistoryRepository =
    new (repository<NotificationsHistory>({
        tableName: 'notificationsHistory',
        columnNames: notificationsHistoryColumns,
        primaryColumnName: 'id',
    }))();
