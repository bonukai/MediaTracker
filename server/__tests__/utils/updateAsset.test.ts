import fs from 'fs-extra';
import axios from 'axios';

import { downloadAsset, updateAsset } from 'src/utils';

import { clearDatabase, runMigrations } from '__tests__/__utils__/utils';
import { Database } from 'src/dbconfig';

const mediaItem = {
  id: 1,
  title: 'title',
  source: 'user',
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

    const newUrl = 'http://example2.com';

    await updateAsset({
      type: 'poster',
      mediaItemId: mediaItem.id,
      url: url,
    });

    await updateAsset({
      type: 'poster',
      mediaItemId: mediaItem.id,
      seasonId: season.id,
      url: url,
    });

    const mediaItemImage = await Database.knex('image')
      .where('seasonId', null)
      .where('mediaItemId', mediaItem.id)
      .first();

    const seasonImage = await Database.knex('image')
      .where('seasonId', season.id)
      .where('mediaItemId', mediaItem.id)
      .first();

    expect(mediaItemImage.id).toBeDefined();
    expect(seasonImage.id).toBeDefined();
    expect(rmSpy).toBeCalledTimes(0);

    jest.spyOn(fs, 'pathExists').mockImplementation(() => true);

    await updateAsset({
      type: 'poster',
      mediaItemId: mediaItem.id,
      url: newUrl,
    });

    await updateAsset({
      type: 'poster',
      mediaItemId: mediaItem.id,
      seasonId: season.id,
      url: url,
    });

    const updatedMediaItemImage = await Database.knex('image')
      .where('seasonId', null)
      .where('mediaItemId', mediaItem.id)
      .first();

    const updatedSeasonImage = await Database.knex('image')
      .where('seasonId', season.id)
      .where('mediaItemId', mediaItem.id)
      .first();

    expect(updatedMediaItemImage.id).toBeDefined();
    expect(updatedSeasonImage.id).toBeDefined();
    expect(updatedMediaItemImage.id).not.toBe(mediaItemImage.id);
    expect(updatedSeasonImage.id).not.toBe(seasonImage.id);
    expect(rmSpy).toBeCalled();

    rmSpy.mockReset();
    jest.spyOn(fs, 'pathExists').mockImplementation(() => false);

    await updateAsset({
      type: 'poster',
      mediaItemId: mediaItem.id,
      url: newUrl,
    });

    await updateAsset({
      type: 'poster',
      mediaItemId: mediaItem.id,
      seasonId: season.id,
      url: url,
    });

    expect(rmSpy).not.toBeCalled();
  });
});
