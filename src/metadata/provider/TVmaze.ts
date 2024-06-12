import _ from 'lodash';
import { z } from 'zod';

import { MediaItemMetadata } from '../../entity/mediaItemModel.js';
import { logger } from '../../logger.js';
import { requestQueueFactory } from '../../requestQueue.js';
import { dumpFetchResponse, h, tryParseISODate } from '../../utils.js';
import { metadataProviderFactory } from '../metadataProvider.js';

export const TVmaze = metadataProviderFactory({
  name: 'TVmaze',
  mediaType: 'tv',
  async search(args) {
    const res = await makeApiRequest(
      `https://api.tvmaze.com/search/shows?q=${args.query}`
    );

    if (res.status !== 200) {
      throw new Error(await dumpFetchResponse(res));
    }

    const data = tvSearchResponseSchema.parse(await res.json());

    return data.map((item) => ({
      ...mapTvShowResponse(item.show),
      needsDetails: true,
    }));
  },
  async details({ tvmazeId }) {
    if (typeof tvmazeId !== 'number') {
      throw new Error(
        `unable to retrieve details from TVmaze without tvmazeId`
      );
    }

    const res = await makeApiRequest(
      ` https://api.tvmaze.com/shows/${tvmazeId}?embed[]=seasons&embed[]=episodes`
    );

    if (res.status === 404) {
      throw new Error(`TV show with tvmazeId ${tvmazeId} does not exists`);
    }

    if (res.status !== 200) {
      throw new Error(await dumpFetchResponse(res));
    }

    const data = tvShowDetailsResponseSchema.parse(await res.json());

    return {
      mediaType: 'tv',
      source: this.name,
      title: data.name,
      imdbId: data.externals.imdb,
      tvdbId: data.externals.thetvdb,
      tvmazeId: data.id,
      overview: data.summary,
      language: data.language,
      genres: data.genres,
      releaseDate: tryParseISODate(data.premiered)?.toISOString(),
      status: data.status,
      url: data.officialSite,
      network: data.network?.name,
      externalPosterUrl: data.image?.medium,
      runtime: data.averageRuntime,
      seasons: data._embedded.seasons.map((season) => ({
        isSpecialSeason: season.number === 0,
        seasonNumber: season.number,
        title: season.name || `Season ${season.number}`,
        description: season.summary,
        externalPosterUrl: season.image?.medium,
        releaseDate: tryParseISODate(season.premiereDate)?.toISOString(),
        episodes: data._embedded.episodes
          .filter((episode) => episode.season === season.number)
          .map((episode) => ({
            title: episode.name,
            description: episode.summary,
            episodeNumber: episode.number,
            seasonNumber: episode.season,
            releaseDate: tryParseISODate(episode.airstamp)?.toISOString(),
            isSpecialEpisode: episode.type === 'insignificant_special',
            runtime: episode.runtime,
          })),
      })),
    };
  },

  async findByImdbId(imdbId) {
    const res = await makeApiRequest(
      ` https://api.tvmaze.com/lookup/shows?imdb=${imdbId}`
    );

    if (res.status === 404) {
      return;
    }

    if (res.status !== 200) {
      throw new Error(await dumpFetchResponse(res));
    }

    return mapTvShowResponse(tvShowResponseSchema.parse(await res.json()));
  },
  async findByTvdbId(tvdbId) {
    const res = await makeApiRequest(
      ` https://api.tvmaze.com/lookup/shows?thetvdb=${tvdbId}`
    );

    if (res.status === 404) {
      return;
    }

    if (res.status !== 200) {
      throw new Error(await dumpFetchResponse(res));
    }

    return mapTvShowResponse(tvShowResponseSchema.parse(await res.json()));
  },
  async addEpisodeReleaseDates(
    mediaItem: MediaItemMetadata
  ): Promise<MediaItemMetadata> {
    logger.debug(
      h`adding episode release dates from TvMaze to "${mediaItem.title}"`
    );

    const tvShow = await (async () => {
      if (mediaItem.tvmazeId) {
        return await this.details({ tvmazeId: mediaItem.tvmazeId });
      }

      if (mediaItem.imdbId) {
        const show = await this.findByImdbId(mediaItem.imdbId);

        if (show) {
          return await this.details({ tvmazeId: show.tvmazeId });
        }
      }

      if (mediaItem.tvdbId) {
        const show = await this.findByTvdbId(mediaItem.tvdbId);

        if (show) {
          return await this.details({ tvmazeId: show.tvmazeId });
        }
      }
    })();

    if (!tvShow) {
      logger.error(h`unable to find mediaItem "${mediaItem.title}" in TvMaze`);

      return mediaItem;
    }

    const episodeMap = _(tvShow?.seasons.flatMap((season) => season.episodes))
      .groupBy((episode) =>
        [episode.seasonNumber, episode.episodeNumber].toString()
      )
      .mapValues((episodes) => episodes[0].releaseDate)
      .value();

    const episodeReleaseDates = (args: {
      seasonNumber: number;
      episodeNumber: number;
    }) => {
      const { seasonNumber, episodeNumber } = args;
      return episodeMap[[seasonNumber, episodeNumber].toString()];
    };

    return {
      ...mediaItem,
      tvmazeId: tvShow?.tvmazeId,
      seasons: mediaItem.seasons?.map((season) => ({
        ...season,
        episodes: season.episodes?.map((episode) => ({
          ...episode,
          releaseDate: episodeReleaseDates(episode) || episode.releaseDate,
        })),
      })),
    };
  },
});

const requestQueue = requestQueueFactory({ timeBetweenRequests: 500 });

const makeApiRequest = async (url: string) => {
  return await requestQueue(() => fetch(url));
};

const mapTvShowResponse = (
  show: z.infer<typeof tvShowResponseSchema>
): MediaItemMetadata => {
  return {
    mediaType: 'tv',
    source: 'TVmaze',
    title: show.name,
    imdbId: show.externals.imdb,
    tvdbId: show.externals.thetvdb,
    tvmazeId: show.id,
    overview: show.summary,
    language: show.language,
    genres: show.genres,
    releaseDate: show.premiered,
    status: show.status,
    url: show.officialSite,
    network: show.network?.name,
    externalPosterUrl: show.image?.medium,
    runtime: show.averageRuntime,
  };
};

const tvShowResponseSchema = z.object({
  id: z.number(),
  url: z.string(),
  name: z.string(),
  type: z.string(),
  language: z.string().nullable(),
  genres: z.array(z.string()),
  status: z.string(),
  runtime: z.number().nullable(),
  averageRuntime: z.number().nullable(),
  premiered: z.string().nullable(),
  officialSite: z.string().nullable(),
  schedule: z.object({ time: z.string(), days: z.array(z.string()) }),
  rating: z.object({ average: z.number().nullable() }),
  externals: z.object({
    tvrage: z.number().nullable(),
    thetvdb: z.number().nullable(),
    imdb: z.string().nullable(),
  }),
  image: z.object({ medium: z.string(), original: z.string() }).nullish(),
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
  summary: z.string().nullish(),
  updated: z.number(),
});

const tvSearchResponseSchema = z.array(
  z.object({
    score: z.number(),
    show: tvShowResponseSchema,
  })
);

const tvShowDetailsResponseSchema = z.object({
  ...tvShowResponseSchema.shape,
  _embedded: z.object({
    seasons: z.array(
      z.object({
        id: z.number(),
        url: z.string(),
        number: z.number(),
        name: z.string(),
        premiereDate: z.string().nullable(),
        endDate: z.string().nullable(),
        network: z
          .object({
            id: z.number(),
            name: z.string(),
            country: z.object({
              name: z.string(),
              code: z.string(),
              timezone: z.string(),
            }),
            officialSite: z.string().nullable(),
          })
          .nullable(),
        image: z
          .object({ medium: z.string(), original: z.string() })
          .nullable(),
        summary: z.string().nullable(),
        _links: z.object({ self: z.object({ href: z.string() }) }),
      })
    ),
    episodes: z.array(
      z.object({
        id: z.number(),
        url: z.string().nullable(),
        name: z.string(),
        season: z.number(),
        number: z.number(),
        type: z.enum(['regular', 'insignificant_special']),
        airdate: z.string().nullable(),
        airtime: z.string().nullable(),
        airstamp: z.string().nullable(),
        runtime: z.number().nullable(),
        rating: z.object({ average: z.number().nullable() }),
        image: z
          .object({ medium: z.string(), original: z.string() })
          .nullable(),
        summary: z.string().nullable(),
        _links: z.object({
          self: z.object({ href: z.string() }),
          show: z.object({ href: z.string() }),
        }),
      })
    ),
  }),
});
