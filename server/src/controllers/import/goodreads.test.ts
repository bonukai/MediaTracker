import axios from 'axios';
import { Config } from 'src/config';

import { importFromGoodreadsRss } from 'src/controllers/import/goodreads';
import { Database } from 'src/dbconfig';

import { Seen } from 'src/entity/seen';
import { User } from 'src/entity/user';
import { UserRating } from 'src/entity/userRating';
import { Watchlist } from 'src/entity/watchlist';
import { logger } from 'src/logger';
import { clearDatabase, runMigrations } from '__tests__/__utils__/utils';
import GoodReadsXML from './goodreads.xml';

jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;

const user: User = {
  id: 1,
  name: 'user',
  slug: 'user',
  password: 'password',
};

describe('Goodreads import', () => {
  beforeAll(runMigrations);
  afterAll(clearDatabase);

  beforeAll(async () => {
    await Database.knex('user').insert(user);
  });

  test('import', async () => {
    mockedAxios.get.mockResolvedValue({ data: GoodReadsXML });

    const url =
      'https://www.goodreads.com/review/list_rss/123456789?key=KEY&shelf=%23ALL%23';
    const userId = user.id;

    const res = await importFromGoodreadsRss(url, userId);

    expect(mockedAxios.get).toHaveBeenCalledWith(url);
    expect(res).toEqual({
      currentlyReading: 1,
      ratings: 38,
      read: 38,
      toRead: 7,
    });

    await importFromGoodreadsRss(url, userId);
  });

  test('watchlist', async () => {
    const watchlist = await Database.knex<Watchlist>('watchlist').where({
      userId: user.id,
    });
    expect(watchlist.length).toEqual(7);
  });

  test('ratings', async () => {
    const ratings = await Database.knex<UserRating>('userRating').where({
      userId: user.id,
    });
    expect(ratings.length).toEqual(38);
  });

  test('read', async () => {
    const read = await Database.knex<Seen>('seen').where({
      userId: user.id,
      type: 'seen',
    });
    expect(read.length).toEqual(38);
  });

  test('toRead', async () => {
    const toRead = await Database.knex<Seen>('seen').where({
      progress: 0,
      type: 'progress',
      userId: user.id,
    });
    expect(toRead.length).toEqual(1);
  });

  test('book details', async () => {
    const book = await Database.knex('mediaItem')
      .where({
        title: 'The Brothers Karamazov',
        source: 'goodreads',
        goodreadsId: 4934,
        overview:
          'The Brothers Karamazov is a murder mystery, a courtroom drama, and an exploration of erotic rivalry in a series of triangular love affairs involving the “wicked and sentimental” Fyodor Pavlovich Karamazov and his three sons―the impulsive and sensual Dmitri; the coldly rational Ivan; and the healthy, red-cheeked young novice Alyosha. Through the gripping events of their story, Dostoevsky portrays the whole of Russian life, is social and spiritual striving, in what was both the golden age and a tragic turning point in Russian culture.<br /><br />This award-winning translation by Richard Pevear and Larissa Volokhonsky remains true to the verbal<br />inventiveness of Dostoevsky’s prose, preserving the multiple voices, the humor, and the surprising modernity of the original. It is an achievement worthy of Dostoevsky’s last and greatest novel.',
        numberOfPages: 796,
        authors: 'Fyodor Dostoevsky',
      })
      .first();

    expect(book).toBeDefined();
  });
});
