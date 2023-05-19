import fs from 'fs-extra';
import axios from 'axios';

import { downloadAsset, updateAsset } from 'src/utils';

import { clearDatabase, runMigrations } from '__tests__/__utils__/utils';
import { Database } from 'src/dbconfig';
import { MediaItemBase } from 'src/entity/mediaItem';

const mediaItem: MediaItemBase = {
  id: 1,
  title: 'title',
  source: 'user',
  mediaType: 'tv',
};

const season = {
  id: 1,
  title: 'title',
  seasonNumber: 1,
  isSpecialSeason: false,
  tvShowId: mediaItem.id,
  numberOfEpisodes: 1,
};

describe('updateAsset', () => {
  beforeAll(async () => {
    await runMigrations();

    await Database.knex('mediaItem').insert(mediaItem);
    await Database.knex('season').insert(season);
  });

  afterAll(clearDatabase);

  test('updateAsset', async () => {
    const imageId = '12345';
    const url = 'http://example.com';

    const ensureDirSpy = jest
      .spyOn(fs, 'ensureDir')
      .mockImplementation(jest.fn());

    const axiosSpy = jest.spyOn(axios, 'get').mockImplementation(
      jest.fn(async () => ({
        status: 200,
        data: new Uint8Array([]),
      }))
    );

    const rmSpy = jest.spyOn(fs, 'rm').mockImplementation(jest.fn());

    await downloadAsset({
      imageId: imageId,
      url: url,
    });

    expect(axiosSpy).toBeCalledWith(url, {
      responseType: 'arraybuffer',
    });

    expect(ensureDirSpy).toBeCalled();

    await updateAsset({
      type: 'poster',
      mediaItem: mediaItem,
    });

    await updateAsset({
      type: 'poster',
      mediaItem: mediaItem,
      season: season,
    });

    const mediaItemWithImage = await Database.knex('mediaItem')
      .where('id', mediaItem.id)
      .first();

    const seasonWithImage = await Database.knex('season')
      .where('id', season.id)
      .first();

    expect(mediaItemWithImage.posterId).toBeDefined();
    expect(seasonWithImage.posterId).toBeDefined();
    expect(rmSpy).toBeCalledTimes(0);

    jest.spyOn(fs, 'pathExists').mockImplementation(() => true);

    await updateAsset({
      type: 'poster',
      mediaItem: {
        ...mediaItem,
        posterId: 'abc',
      },
    });

    await updateAsset({
      type: 'poster',
      mediaItem: mediaItem,
      season: season,
    });

    const updatedMediaItem = await Database.knex('mediaItem')
      .where('id', mediaItem.id)
      .first();

    const updatedSeason = await Database.knex('season')
      .where('id', season.id)
      .first();

    expect(updatedMediaItem.posterId).toBeDefined();
    expect(updatedSeason.posterId).toBeDefined();
    expect(updatedSeason.posterId).not.toBe(
      seasonWithImage.posterId
    );
    expect(rmSpy).toBeCalled();

    rmSpy.mockReset();
    jest.spyOn(fs, 'pathExists').mockImplementation(() => false);

    await updateAsset({
      type: 'poster',
      mediaItem: mediaItem,
    });

    await updateAsset({
      type: 'poster',
      mediaItem: mediaItem,
      season: season,
    });

    expect(rmSpy).not.toBeCalled();
  });
});
