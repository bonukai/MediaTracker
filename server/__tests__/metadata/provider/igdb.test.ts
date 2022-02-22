import axios from 'axios';
import { clearDatabase, runMigrations } from '__tests__/__utils__/utils';
import { IGDB } from 'src/metadata/provider/igdb';

import detailsResponse from './mock/igdb/detailsResponse.json';
import searchResponse from './mock/igdb/searchResponse.json';

jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;

const igdb = new IGDB();

describe('IGDB', () => {
  beforeAll(runMigrations);
  afterAll(clearDatabase);

  test('TMDbMovie search', async () => {
    mockedAxios.post.mockResolvedValue({
      data: searchResponse,
      status: 200,
    });
    const res = await igdb.search('Harry Potter');
    expect(res).toStrictEqual(searchResult);
  });

  test('TMDbMovie details', async () => {
    mockedAxios.post.mockResolvedValue({
      data: detailsResponse,
      status: 200,
    });
    const res = await igdb.details({
      igdbId: 19560,
    });
    expect(res).toStrictEqual(detailsResult);
  });
});

const searchResult = [
  {
    needsDetails: false,
    source: 'IGDB',
    mediaType: 'video_game',
    igdbId: 19560,
    releaseDate: '2018-04-20T00:00:00.000Z',
    title: 'God of War',
    overview:
      'God of War is the sequel to God of War III as well as a continuation of the canon God of War chronology. Unlike previous installments, this game focuses on Norse mythology and follows an older and more seasoned Kratos and his son Atreus in the years since the third game. It is in this harsh, unforgiving world that he must fight to survive… and teach his son to do the same.',
    poster: 'https://images.igdb.com/igdb/image/upload/t_original/co1tmu.jpg',
    genres: ["Hack and slash/Beat 'em up", 'Adventure'],
    url: 'https://godofwar.playstation.com',
    developer: 'SIE Santa Monica Studio',
    platform: ['PC (Microsoft Windows)', 'PlayStation 4'],
  },
  {
    needsDetails: false,
    source: 'IGDB',
    mediaType: 'video_game',
    igdbId: 551,
    releaseDate: '2007-03-13T00:00:00.000Z',
    title: 'God of War II',
    overview:
      'Kratos is now the God of War, having defeated the Olympian god Ares. Shunned by the other gods and still haunted by nightmares from his past, Kratos decides to join an army of Spartans in an attack on the city of Rhodes. Kratos also ignores a warning from the goddess Athena that his lust for revenge is alienating the other gods.',
    poster: 'https://images.igdb.com/igdb/image/upload/t_original/co3dik.jpg',
    genres: ['Platform', "Hack and slash/Beat 'em up", 'Adventure'],
    url: 'https://en.wikipedia.org/wiki/God_of_War_II',
    developer: 'SIE Santa Monica Studio',
    platform: ['PlayStation 2'],
  },
  {
    needsDetails: false,
    source: 'IGDB',
    mediaType: 'video_game',
    igdbId: 117882,
    releaseDate: '2010-10-02T00:00:00.000Z',
    title: 'God of War II HD',
    overview:
      "Kratos, the once mortal warrior turned ruthless god, sits atop his throne on Olympus as a threat far worse than his predecessor Ares had ever been, striking down anyone who crosses his path or the path of his beloved Sparta. The 'Ghost of Sparta' sets out to alter that which no mortal or god has ever changed. His fate.\n" +
      '\n' +
      'Remastered at a resolution of 720p.\n' +
      'Anti-aliased graphics for 60 frames per second gameplay.',
    poster: 'https://images.igdb.com/igdb/image/upload/t_original/co3dim.jpg',
    genres: ["Hack and slash/Beat 'em up", 'Adventure'],
    url: 'https://en.wikipedia.org/wiki/God_of_War_II',
    developer: 'Bluepoint Games',
    platform: ['PlayStation 3'],
  },
  {
    needsDetails: false,
    source: 'IGDB',
    mediaType: 'video_game',
    igdbId: 1291,
    releaseDate: '2013-03-12T00:00:00.000Z',
    title: 'God of War: Ascension',
    overview:
      'Vengeance is born in the fires of betrayal in this prequel to the best-selling God of War franchise. Six months have passed since Kratos stood over the bodies of his wife and child, his hands stained with their blood - tricked by Ares into murdering the only people he ever loved. Swearing to avenge them, Kratos broke the blood oath that bound him to Ares, but oaths to Olympus are not so easily broken... Sentenced to an eternity chained within a prison for the living damned, Kratos battles insanity at the hands of the Furies. He will be tested as he seeks freedom, redemption for his sins, and the clarity to avenge his family.',
    poster: 'https://images.igdb.com/igdb/image/upload/t_original/co3die.jpg',
    genres: ["Hack and slash/Beat 'em up", 'Adventure'],
    url: 'http://godofwar.playstation.com',
    developer: 'SIE Santa Monica Studio',
    platform: ['PlayStation 3'],
  },
];

const detailsResult = {
  needsDetails: false,
  source: 'IGDB',
  mediaType: 'video_game',
  igdbId: 19560,
  releaseDate: '2018-04-20T00:00:00.000Z',
  title: 'God of War',
  overview:
    'God of War is the sequel to God of War III as well as a continuation of the canon God of War chronology. Unlike previous installments, this game focuses on Norse mythology and follows an older and more seasoned Kratos and his son Atreus in the years since the third game. It is in this harsh, unforgiving world that he must fight to survive… and teach his son to do the same.',
  poster: 'https://images.igdb.com/igdb/image/upload/t_original/co1tmu.jpg',
  genres: ["Hack and slash/Beat 'em up", 'Adventure'],
  url: 'https://godofwar.playstation.com',
  developer: 'SIE Santa Monica Studio',
  platform: ['PC (Microsoft Windows)', 'PlayStation 4'],
};
