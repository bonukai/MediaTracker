import { Image } from 'src/entity/image';
import { repository } from 'src/repository/repository';

export const imageRepository = new (repository<Image>({
    tableName: 'image',
    primaryColumnName: 'id',
}))();
