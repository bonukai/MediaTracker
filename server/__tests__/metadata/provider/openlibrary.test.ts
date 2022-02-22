import axios from 'axios';
import { OpenLibrary } from 'src/metadata/provider/openlibrary';
import { clearDatabase, runMigrations } from '__tests__/__utils__/utils';

import searchResponse from './mock/openlibrary/searchResponse.json';
import detailsResponse from './mock/openlibrary/detailsResponse.json';
import detailsResponse2 from './mock/openlibrary/detailsResponse2.json';

jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;
const openlibraryApi = new OpenLibrary();

describe('openlibrary', () => {
  beforeAll(runMigrations);
  afterAll(clearDatabase);

  test('search', async () => {
    mockedAxios.get.mockResolvedValue({ data: searchResponse });

    const res = await openlibraryApi.search('Harry Potter');

    expect(res).toStrictEqual(searchResult);
  });

  test('details', async () => {
    mockedAxios.get.mockResolvedValue({ data: detailsResponse });

    const res = await openlibraryApi.details({
      openlibraryId: 'works/OL82563W',
    });

    expect(res).toStrictEqual(detailsResult);
  });

  test('details 2', async () => {
    mockedAxios.get.mockResolvedValue({ data: detailsResponse2 });

    const res = await openlibraryApi.details({
      openlibraryId: 'works/OL2019091W',
    });

    expect(res).toStrictEqual(detailsResult2);
  });
});

const searchResult = [
  {
    mediaType: 'book',
    source: 'openlibrary',
    title: "Harry Potter and the Philosopher's Stone",
    poster: 'https://covers.openlibrary.org/b/id/10521270.jpg',
    releaseDate: '1997',
    numberOfPages: 296,
    authors: ['J. K. Rowling'],
    openlibraryId: '/works/OL82563W',
  },
  {
    mediaType: 'book',
    source: 'openlibrary',
    title: 'Harry Potter and the Deathly Hallows',
    poster: 'https://covers.openlibrary.org/b/id/10110415.jpg',
    releaseDate: '2007',
    numberOfPages: 640,
    authors: ['J. K. Rowling'],
    openlibraryId: '/works/OL82586W',
  },
  {
    mediaType: 'book',
    source: 'openlibrary',
    title: 'Harry Potter and the Chamber of Secrets',
    poster: 'https://covers.openlibrary.org/b/id/8234423.jpg',
    releaseDate: '1998',
    numberOfPages: 341,
    authors: ['J. K. Rowling'],
    openlibraryId: '/works/OL82537W',
  },
  {
    mediaType: 'book',
    source: 'openlibrary',
    title: 'Harry Potter and the Half-Blood Prince',
    poster: 'https://covers.openlibrary.org/b/id/10716273.jpg',
    releaseDate: '2001',
    numberOfPages: 652,
    authors: ['J. K. Rowling'],
    openlibraryId: '/works/OL82565W',
  },
];

const detailsResult = {
  mediaType: 'book',
  source: 'openlibrary',
  title: "Harry Potter and the Philosopher's Stone",
  overview:
    'Harry Potter #1\r\n' +
    '\r\n' +
    'When mysterious letters start arriving on his doorstep, Harry Potter has never heard of Hogwarts School of Witchcraft and Wizardry.\r\n' +
    '\r\n' +
    'They are swiftly confiscated by his aunt and uncle.\r\n' +
    '\r\n' +
    'Then, on Harry’s eleventh birthday, a strange man bursts in with some important news: Harry Potter is a wizard and has been awarded a place to study at Hogwarts.\r\n' +
    '\r\n' +
    'And so the first of the Harry Potter adventures is set to begin.\r\n' +
    '([source][1])\r\n' +
    '\r\n' +
    '\r\n' +
    '  [1]: https://www.jkrowling.com/book/harry-potter-philosophers-stone/',
  releaseDate: undefined,
} as unknown;

const detailsResult2 = {
  mediaType: 'book',
  source: 'openlibrary',
  title: 'Oraciones y pensamientos',
  overview:
    'En medio del ritmo acelerado del mundo actual, es necesario recogerse y elevar la mente y el corazón hacia el Señor. Estas concisas plegarias y reflexiones de Luis Fernando Figari, fundador de diversas asociaciones de la Iglesia, ofrecen la ocasión de centrarse en lo esencial y de recorrer el sendero de la existencia desde el realismo de la esperanza, con la mirada puesta en Aquel que es el Camino, la Verdad y la Vida.',
  releaseDate: '2009',
};
