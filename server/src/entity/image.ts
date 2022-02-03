import { customAlphabet } from 'nanoid';

export type ImageType = 'poster' | 'backdrop';

export type Image = {
    id: string;
    mediaItemId: number;
    seasonId?: number;
    type: ImageType;
};

export const getImageId = customAlphabet('1234567890abcdef', 32);
