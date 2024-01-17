import { z } from 'zod';
import { metadataProviderFactory } from '../metadataProvider.js';
import { dumpFetchResponse } from '../../utils.js';

export const TVmaze = metadataProviderFactory({
  name: 'TVmaze',
  mediaType: 'tv',
  async search(args) {
    const res = await fetch(
      `https://api.tvmaze.com/search/shows?q=${args.query}`
    );

    const data = tvSearchResponseSchema.parse(await res.json());

    return data.map((item) => ({
      mediaType: 'tv',
      source: this.name,
      title: item.show.name,
      imdbId: item.show.externals.imdb,
      tvdbId: item.show.externals.thetvdb,
      tvmazeId: item.show.id,
      overview: item.show.summary,
      language: item.show.language,
      genres: item.show.genres,
      releaseDate: item.show.premiered,
      status: item.show.status,
      url: item.show.officialSite,
      network: item.show.network?.name,
      externalPosterUrl: item.show.image?.medium,
      runtime: item.show.averageRuntime,
      needsDetails: true,
    }));
  },
  async details({ tvmazeId }) {
    if (typeof tvmazeId !== 'number') {
      throw new Error(
        `unable to retrieve details from TVmaze without tvmazeId`
      );
    }

    const res = await fetch(
      ` https://api.tvmaze.com/shows/${tvmazeId}?embed=episodes`
    );

    if (res.status === 404) {
      throw new Error(`TV show with tvmazeId ${tvmazeId} does not exists`);
    }

    if (res.status !== 200) {
      throw new Error(await dumpFetchResponse(res));
    }

    const data = tvShowDetailsResponseSchema.parse(await res.json());
    console.log(data._embedded.episodes);
    // return data;
  },

  async findByImdbId(imdbId) {
    // https://api.tvmaze.com/lookup/shows?imdb=tt0944947
  },
  async findByTvdbId(tvdbId) {
    // https://api.tvmaze.com/lookup/shows?thetvdb=81189
  },
});

const tvSearchResponseSchema = z.array(
  z.object({
    score: z.number(),
    show: z.object({
      id: z.number(),
      url: z.string(),
      name: z.string(),
      type: z.string(),
      language: z.string().nullish(),
      genres: z.array(z.string()),
      status: z.string(),
      runtime: z.number().nullish(),
      averageRuntime: z.number().nullish(),
      premiered: z.string().nullish(),
      ended: z.string().nullish(),
      officialSite: z.string().nullish(),
      schedule: z
        .object({ time: z.string(), days: z.array(z.string()) })
        .nullish(),
      rating: z
        .object({
          average: z.number().nullish(),
        })
        .nullish(),
      network: z
        .object({
          id: z.number(),
          name: z.string(),
          country: z.object({
            name: z.string(),
            code: z.string(),
            timezone: z.string(),
          }),
          officialSite: z.string().nullish(),
        })
        .nullish(),

      externals: z.object({
        tvrage: z.number().nullish(),
        thetvdb: z.number().nullish(),
        imdb: z.string().nullish(),
      }),
      image: z.object({ medium: z.string(), original: z.string() }).nullish(),
      summary: z.string().nullish(),
      updated: z.number(),
    }),
  })
);

const tvShowDetailsResponseSchema = z.object({
  id: z.number(),
  url: z.string(),
  name: z.string(),
  type: z.string(),
  language: z.string(),
  genres: z.array(z.string()),
  status: z.string(),
  runtime: z.null(),
  averageRuntime: z.number(),
  premiered: z.string(),
  officialSite: z.string(),
  schedule: z.object({ time: z.string(), days: z.array(z.string()) }),
  rating: z.object({ average: z.number() }),
  externals: z.object({
    tvrage: z.null(),
    thetvdb: z.number(),
    imdb: z.string(),
  }),
  image: z.object({ medium: z.string(), original: z.string() }),
  summary: z.string(),
  updated: z.number(),
  _embedded: z.object({
    episodes: z.array(
      z.union([
        z.object({
          id: z.number(),
          url: z.string(),
          name: z.string(),
          season: z.number(),
          number: z.number(),
          type: z.string(),
          airdate: z.string(),
          airtime: z.string(),
          airstamp: z.string(),
          runtime: z.number(),
          rating: z.object({ average: z.number() }),
          image: z.object({ medium: z.string(), original: z.string() }),
          summary: z.string(),
          _links: z.object({
            self: z.object({ href: z.string() }),
            show: z.object({ href: z.string() }),
          }),
        }),
        z.object({
          id: z.number(),
          url: z.string(),
          name: z.string(),
          season: z.number(),
          number: z.number(),
          type: z.string(),
          airdate: z.string(),
          airtime: z.string(),
          airstamp: z.string(),
          runtime: z.number(),
          rating: z.object({ average: z.null() }),
          image: z.object({ medium: z.string(), original: z.string() }),
          summary: z.string(),
          _links: z.object({
            self: z.object({ href: z.string() }),
            show: z.object({ href: z.string() }),
          }),
        }),
        z.object({
          id: z.number(),
          url: z.string(),
          name: z.string(),
          season: z.number(),
          number: z.number(),
          type: z.string(),
          airdate: z.string(),
          airtime: z.string(),
          airstamp: z.string(),
          runtime: z.null(),
          rating: z.object({ average: z.null() }),
          image: z.null(),
          summary: z.null(),
          _links: z.object({
            self: z.object({ href: z.string() }),
            show: z.object({ href: z.string() }),
          }),
        }),
      ])
    ),
  }),
});
