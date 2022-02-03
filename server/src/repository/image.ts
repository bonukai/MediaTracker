import { getImageId, Image } from 'src/entity/image';
import { repository } from 'src/repository/repository';

class ImageRepository extends repository<Image>({
    tableName: 'image',
    primaryColumnName: 'id',
}) {
    public create(value: Partial<Image>): Promise<string> {
        return super.create({
            ...value,
            id: getImageId(),
        });
    }
}

export const imageRepository = new ImageRepository();
