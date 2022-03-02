import axios from 'axios';
import { Audible } from 'src/metadata/provider/audible';
import { clearDatabase, runMigrations } from '__tests__/__utils__/utils';
import { GlobalConfiguration } from 'src/repository/globalSettings';

import searchResponse from './mock/audible/searchResponse.json';
import detailsResponse from './mock/audible/detailsResponse.json';
import emptyDetailsResponse from './mock/audible/emptyDetailsResponse.json';

jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;
const audible = new Audible();

describe('audible', () => {
  beforeAll(runMigrations);
  afterAll(clearDatabase);

  beforeAll(() => {
    jest
      .spyOn(GlobalConfiguration, 'configuration', 'get')
      .mockImplementation(() => ({
        enableRegistration: false,
        audibleLang: 'fr',
      }));
  });

  test('search', async () => {
    mockedAxios.get.mockResolvedValue({ data: searchResponse, status: 200 });

    const res = await audible.search('Harry Potter');

    expect(res).toStrictEqual(searchResult);
  });

  test('details', async () => {
    mockedAxios.get.mockResolvedValue({ data: detailsResponse, status: 200 });

    const res = await audible.details({
      audibleId: 'B017V4IM1G',
      countryCode: 'it',
    });

    expect(res).toStrictEqual(detailsResult);
  });

  test('details with empty response', async () => {
    mockedAxios.get.mockImplementation(async (url, config) => ({
      data: emptyDetailsResponse,
      status: 200,
      config: config,
    }));

    await expect(
      audible.details({
        audibleId: 'B017V4IM1G',
      })
    ).rejects.toThrowError(/B017V4IM1G/);
  });
});

const searchResult = [
  {
    needsDetails: false,
    mediaType: 'audiobook',
    source: 'audible',
    title: "Harry Potter and the Sorcerer's Stone, Book 1",
    audibleId: 'B017V4IM1G',
    authors: ['J.K. Rowling'],
    narrators: ['Jim Dale'],
    poster: 'https://m.media-amazon.com/images/I/91tDBrO2u9L._SL2400_.jpg',
    language: 'english',
    releaseDate: '2015-11-20',
    runtime: 498,
    overview:
      '<p>Harry Potter is a wizard - and not only a wizard, he’s an incredibly famous wizard. Rubeus Hagrid spirits him away from his less-than-fortunate life to Hogwarts School of Witchcraft and Wizardry, setting into motion an incredible adventure....</p>',
    audibleCountryCode: 'fr',
  },
  {
    needsDetails: false,
    mediaType: 'audiobook',
    source: 'audible',
    title: 'Harry Potter and the Goblet of Fire, Book 4',
    audibleId: 'B017V4NUPO',
    authors: ['J.K. Rowling'],
    narrators: ['Jim Dale'],
    poster: 'https://m.media-amazon.com/images/I/91wE69EbTKL._SL2400_.jpg',
    language: 'english',
    releaseDate: '2015-11-20',
    runtime: 1237,
    overview:
      "The Triwizard Tournament is to be held at Hogwarts. Only wizards who are over seventeen are allowed to enter - but that doesn't stop Harry dreaming that he will win the competition....",
    audibleCountryCode: 'fr',
  },
  {
    needsDetails: false,
    mediaType: 'audiobook',
    source: 'audible',
    title: 'Harry Potter and the Prisoner of Azkaban, Book 3',
    audibleId: 'B017V4JA2Q',
    authors: ['J.K. Rowling'],
    narrators: ['Jim Dale'],
    poster: 'https://m.media-amazon.com/images/I/91wkoe9lV4L._SL2400_.jpg',
    language: 'english',
    releaseDate: '2015-11-20',
    runtime: 709,
    overview:
      "<p>When the Knight Bus crashes through the darkness and screeches to a halt in front of him, it's the start of another far-from-ordinary year at Hogwarts for Harry Potter....</p>",
    audibleCountryCode: 'fr',
  },
  {
    needsDetails: false,
    mediaType: 'audiobook',
    source: 'audible',
    title: 'Harry Potter and the Order of the Phoenix, Book 5',
    audibleId: 'B017V4NMX4',
    authors: ['J.K. Rowling'],
    narrators: ['Jim Dale'],
    poster: 'https://m.media-amazon.com/images/I/91lexie8rNL._SL2400_.jpg',
    language: 'english',
    releaseDate: '2015-11-20',
    runtime: 1589,
    overview:
      "Dark times have come to Hogwarts. After the Dementors' attack on his cousin Dudley, Harry Potter knows that Voldemort will stop at nothing to find him....",
    audibleCountryCode: 'fr',
  },
];

const detailsResult = {
  needsDetails: false,
  mediaType: 'audiobook',
  source: 'audible',
  title: "Harry Potter and the Sorcerer's Stone, Book 1",
  audibleId: 'B017V4IM1G',
  authors: ['J.K. Rowling'],
  narrators: ['Jim Dale'],
  poster: 'https://m.media-amazon.com/images/I/91tDBrO2u9L._SL2400_.jpg',
  language: 'english',
  releaseDate: '2015-11-20',
  runtime: 498,
  overview:
    '<p>Harry Potter is a wizard - and not only a wizard, he’s an incredibly famous wizard. Rubeus Hagrid spirits him away from his less-than-fortunate life to Hogwarts School of Witchcraft and Wizardry, setting into motion an incredible adventure....</p>',
  audibleCountryCode: 'it',
};
