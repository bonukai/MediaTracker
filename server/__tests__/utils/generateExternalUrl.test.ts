import { generateExternalUrl } from 'src/utils';

describe('generateExternalUrl', () => {
  test('should return undefined when there is no external id', async () => {
    expect(
      generateExternalUrl({
        mediaType: 'tv',
        source: 'user',
        title: 'title',
      })
    ).toBeUndefined();
  });

  test('should generate correct link for Tv show on TMDB', async () => {
    expect(
      generateExternalUrl({
        mediaType: 'tv',
        source: 'user',
        title: 'Lost',
        tmdbId: 4607,
      })
    ).toEqual('https://www.themoviedb.org/tv/4607');
  });

  test('should generate correct link for movie on TMDB', async () => {
    expect(
      generateExternalUrl({
        mediaType: 'movie',
        source: 'user',
        title: 'The Prestige',
        tmdbId: 1124,
      })
    ).toEqual('https://www.themoviedb.org/movie/1124');
  });

  test('should generate correct link for Tv show on imdb', async () => {
    expect(
      generateExternalUrl({
        mediaType: 'tv',
        source: 'user',
        title: 'Lost',
        imdbId: 'tt0411008',
      })
    ).toEqual('https://www.imdb.com/title/tt0411008');
  });

  test('should generate correct link for movie on imdb', async () => {
    expect(
      generateExternalUrl({
        mediaType: 'movie',
        source: 'user',
        title: 'The Prestige',
        imdbId: 'tt0482571',
      })
    ).toEqual('https://www.imdb.com/title/tt0482571');
  });

  test('should NOT generate link from imdb and media types other then tv or movie', async () => {
    expect(
      generateExternalUrl({
        mediaType: 'audiobook',
        source: 'user',
        title: 'The Prestige',
        imdbId: 'tt0482571',
      })
    ).toBeUndefined();

    expect(
      generateExternalUrl({
        mediaType: 'book',
        source: 'user',
        title: 'The Prestige',
        imdbId: 'tt0482571',
      })
    ).toBeUndefined();

    expect(
      generateExternalUrl({
        mediaType: 'video_game',
        source: 'user',
        title: 'The Prestige',
        imdbId: 'tt0482571',
      })
    ).toBeUndefined();
  });

  test('should NOT generate link from tmdb and media types other then tv or movie', async () => {
    expect(
      generateExternalUrl({
        mediaType: 'audiobook',
        source: 'user',
        title: 'The Prestige',
        tmdbId: 1124,
      })
    ).toBeUndefined();

    expect(
      generateExternalUrl({
        mediaType: 'book',
        source: 'user',
        title: 'The Prestige',
        tmdbId: 1124,
      })
    ).toBeUndefined();

    expect(
      generateExternalUrl({
        mediaType: 'video_game',
        source: 'user',
        title: 'The Prestige',
        tmdbId: 1124,
      })
    ).toBeUndefined();
  });

  test('should generate link to igdbId for video_game', async () => {
    expect(
      generateExternalUrl({
        mediaType: 'video_game',
        source: 'user',
        title: 'The Last of Us',
        igdbId: 1009,
      })
    ).toBe('https://www.igdb.com/games/the-last-of-us');
  });

  test('should generate link to openlibraryId for book', async () => {
    expect(
      generateExternalUrl({
        mediaType: 'book',
        source: 'user',
        title: 'East of Eden',
        openlibraryId: '/works/OL23166W',
      })
    ).toBe('https://openlibrary.org/works/OL23166W');
  });

  test('should generate link to audible for audiobook with correct domain', async () => {
    expect(
      generateExternalUrl({
        mediaType: 'audiobook',
        source: 'user',
        title: 'East of Eden',
        audibleId: 'B09N7P9W5B',
        audibleCountryCode: 'uk',
      })
    ).toMatch('https://audible.co.uk/pd/B09N7P9W5B');

    expect(
      generateExternalUrl({
        mediaType: 'audiobook',
        source: 'user',
        title: 'East of Eden',
        audibleId: 'B09N7QD3TR',
        audibleCountryCode: 'us',
      })
    ).toMatch('https://audible.com/pd/B09N7QD3TR');
  });
});
