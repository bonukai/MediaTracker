export type ImageType = 'poster' | 'backdrop';

export type Image = {
    id: string;
    mediaItemId: number;
    seasonId?: number;
    type: ImageType;
};
