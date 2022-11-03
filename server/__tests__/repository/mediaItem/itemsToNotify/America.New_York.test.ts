/**
 * @jest-environment <rootDir>/__tests__/__utils__/custom-timezone.ts
 * @timezone America/New_York
 */

import { addHours, subHours } from 'date-fns';
import _ from 'lodash';
import { mediaItemRepository } from 'src/repository/mediaItem';

import { fillDatabase } from '__tests__/repository/mediaItem/itemsToNotify/__utils__/setup';
import { clearDatabase, runMigrations } from '__tests__/__utils__/utils';

describe('itemsToNotify in timezone America/New_York', () => {
  beforeAll(async () => {
    await runMigrations();
    await fillDatabase();
  });

  afterAll(clearDatabase);

  it('timezone offset should match America/New_York timezone', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2022, 6, 31, 19, 1));
    expect(new Date().getTimezoneOffset()).toBe(240);
  });

  it('forward offset', async () => {
    const itemsToNotify = async () =>
      (
        await mediaItemRepository.itemsToNotify(
          new Date(),
          addHours(new Date(), 1)
        )
      ).map((item) => _.pick(item, ['id']));

    const episodesToNotify = async () =>
      (
        await mediaItemRepository.episodesToNotify(
          new Date(),
          addHours(new Date(), 1)
        )
      ).map((item) => _.pick(item, ['id']));

    jest.useFakeTimers();

    // 31/07/2022, 19:01:00 in local time
    // 31/07/2022, 23:01:00 in UTC
    jest.setSystemTime(new Date(2022, 6, 31, 19, 1));
    expect(await itemsToNotify()).toStrictEqual([{ id: 2 }]);
    expect(await episodesToNotify()).toStrictEqual([{ id: 2 }]);

    // 30/06/2022, 23:01:00 in local time
    // 01/07/2022, 03:01:00 in UTC
    jest.setSystemTime(new Date(2022, 5, 30, 23, 1));
    expect(await itemsToNotify()).toStrictEqual([{ id: 1 }]);
    expect(await episodesToNotify()).toStrictEqual([{ id: 1 }]);

    // 01/07/2022, 01:01:00 in local time
    // 01/07/2022, 05:01:00 in UTC
    jest.setSystemTime(new Date(2022, 6, 1, 1, 1));
    expect(await itemsToNotify()).toStrictEqual([]);
    expect(await episodesToNotify()).toStrictEqual([]);

    jest.useRealTimers();
  });

  it('backward offset', async () => {
    const itemsToNotify = async () =>
      (
        await mediaItemRepository.itemsToNotify(
          subHours(new Date(), 1),
          new Date()
        )
      ).map((item) => _.pick(item, ['id']));

    const episodesToNotify = async () =>
      (
        await mediaItemRepository.episodesToNotify(
          subHours(new Date(), 1),
          new Date()
        )
      ).map((item) => _.pick(item, ['id']));

    jest.useFakeTimers();

    // 31/07/2022, 20:01:00 in local time
    // 01/08/2022, 00:01:00 in UTC
    jest.setSystemTime(new Date(2022, 6, 31, 20, 1));
    expect(await itemsToNotify()).toStrictEqual([{ id: 2 }]);
    expect(await episodesToNotify()).toStrictEqual([{ id: 2 }]);

    // 01/07/2022, 00:01:00 in local time
    // 01/07/2022, 04:01:00 in UTC
    jest.setSystemTime(new Date(2022, 6, 1, 0, 1));
    expect(await itemsToNotify()).toStrictEqual([{ id: 1 }]);
    expect(await episodesToNotify()).toStrictEqual([{ id: 1 }]);

    // 01/07/2022, 01:01:00 in local time
    // 01/07/2022, 05:01:00 in UTC
    jest.setSystemTime(new Date(2022, 6, 1, 1, 1));
    expect(await itemsToNotify()).toStrictEqual([]);
    expect(await episodesToNotify()).toStrictEqual([]);

    jest.useRealTimers();
  });

  it('multiple episodes', async () => {
    const episodesToNotify = (
      await mediaItemRepository.episodesToNotify(
        subHours(new Date('2022-08-01'), 24),
        addHours(new Date('2022-08-01'), 24)
      )
    ).map((item) => _.pick(item, ['id']));

    expect(episodesToNotify).toStrictEqual([{ id: 2 }, { id: 3 }, { id: 4 }]);
  });

  it('multiple media items', async () => {
    const itemsToNotify = (
      await mediaItemRepository.itemsToNotify(
        subHours(new Date('2022-08-01'), 24),
        addHours(new Date('2022-08-01'), 24)
      )
    ).map((item) => _.pick(item, ['id']));

    expect(itemsToNotify).toStrictEqual([{ id: 2 }, { id: 3 }, { id: 4 }]);
  });
});
