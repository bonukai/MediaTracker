import { List, ListItem } from 'src/entity/list';
import { repository } from 'src/repository/repository';

export const listRepository = new (repository<List>({
    tableName: 'list',
    primaryColumnName: 'id',
}))();

export const listItemRepository = new (repository<ListItem>({
    tableName: 'listItem',
    primaryColumnName: 'id',
}))();
