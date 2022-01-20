import axios from 'axios';
import { add } from 'date-fns';
import fs from 'fs-extra';
import path from 'path';
import sharp from 'sharp';

import { MediaItemBase } from 'src/entity/mediaItem';
import { TvSeason } from 'src/entity/tvseason';

export const durationToMilliseconds = (duration: Duration) =>
    add(0, duration).getTime();

export const downloadAsset = async (args: {
    assetsType: 'poster' | 'backdrop';
    mediaItem?: MediaItemBase;
    season?: TvSeason;
}) => {
    const { assetsType, mediaItem, season } = args;

    if (!mediaItem && !season) {
        throw new Error('Both mediaItem and season cannot be undefined');
    }

    const mediaItemType = season ? 'season' : 'media_item';

    const imagePath = path.resolve(
        'img',
        assetsType,
        mediaItemType,
        'original',
        `${mediaItem?.id || season?.id}.webp`
    );

    const imageSmallPath = path.resolve(
        'img',
        assetsType,
        mediaItemType,
        'small',
        `${mediaItem?.id || season?.id}.webp`
    );

    const response = await axios.get<Uint8Array>(
        season ? season.poster : mediaItem[assetsType],
        { responseType: 'arraybuffer' }
    );

    await fs.ensureDir(path.dirname(imagePath));
    await sharp(response.data).webp({ quality: 100 }).toFile(imagePath);

    await fs.ensureDir(path.dirname(imageSmallPath));
    await sharp(response.data)
        .resize({ width: 400 })
        .webp({ quality: 80 })
        .toFile(imageSmallPath);
};
