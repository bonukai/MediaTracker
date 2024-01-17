import { z } from 'zod';

import { MediaItemMetadata } from '../../entity/mediaItemModel.js';
import { getConfiguration } from '../../repository/configurationRepository.js';
import { requestQueueFactory } from '../../requestQueue.js';
import { dumpFetchResponse } from '../../utils.js';
import { metadataProviderFactory } from '../metadataProvider.js';

export const IGDB = metadataProviderFactory({
  name: 'IGDB',
  mediaType: 'video_game',
  async search(args) {
    if (!args.query) {
      throw new Error(`query string is not provided`);
    }

    const data = searchResponseSchema.parse(
      await makeApiRequest(
        'games',
        `fields 
            name,
            first_release_date,
            summary,
            cover.image_id, 
            involved_companies.company.name, 
            involved_companies.developer, 
            platforms.name, 
            platforms.platform_logo.id, 
            genres.name, 
            platforms.id,
            release_dates.date,
            release_dates.platform,
            websites.url; 
            search "${args.query}"; 
            where version_parent = null; 
            limit 50;`
      )
    );

    return data.map(mapGame);
  },
  async details(mediaItem): Promise<MediaItemMetadata> {
    if (typeof mediaItem.igdbId !== 'number') {
      throw new Error(`unable to retrieve details from IGDB without igdbId`);
    }

    return this.findByIgdbId(mediaItem.igdbId);
  },
  async findByIgdbId(igdbId: number) {
    const data = searchResponseSchema.parse(
      await makeApiRequest(
        'games',
        `fields 
          name,
          first_release_date,
          summary,
          cover.image_id, 
          involved_companies.company.name, 
          involved_companies.developer, 
          platforms.name, 
          platforms.platform_logo.id, 
          genres.name, 
          platforms.id,
          release_dates.date,
          release_dates.platform,
          websites.url; 
        where id = ${igdbId} & version_parent = null;`
      )
    );

    const firstGameResult = data.at(0);

    if (!firstGameResult) {
      throw new Error(`no info for ${igdbId} in IGDB database`);
    }

    return mapGame(firstGameResult);
  },
});

let token: { accessToken: string; expiresAt: Date } | undefined = undefined;

const requestQueue = requestQueueFactory({ timeBetweenRequests: 250 });

const getIgdbClientIdAndClientSecret = async () => {
  const configuration = await getConfiguration();

  if (!configuration.igdbClientId) {
    throw new Error(`IGDB ClientId is not set`);
  }

  if (!configuration.igdbClientSecret) {
    throw new Error(`IGDB ClientSecret is not set`);
  }

  return {
    clientId: configuration.igdbClientId,
    clientSecret: configuration.igdbClientSecret,
  };
};

const refreshToken = async () => {
  if (token && token.expiresAt < new Date()) {
    return;
  }

  const { clientId, clientSecret } = await getIgdbClientIdAndClientSecret();

  const currentDate = new Date();

  const res = await requestQueue(() =>
    fetch(
      'https://id.twitch.tv/oauth2/token?' +
        new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: 'client_credentials',
        }),
      {
        method: 'POST',
      }
    )
  );

  const data = tokenResponseSchema.parse(await res.json());

  token = {
    accessToken: data.access_token,
    expiresAt: new Date(currentDate.getTime() + data.expires_in * 1000),
  };
};

const makeApiRequest = async (endpoint: string, query: string) => {
  await refreshToken();

  if (!token) {
    throw new Error(`Missing IGDB accessToken`);
  }

  const { accessToken } = token;
  const { clientId } = await getIgdbClientIdAndClientSecret();

  const res = await requestQueue(() =>
    fetch(`https://api.igdb.com/v4/${endpoint}`, {
      body: query,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Client-ID': clientId,
      },
    })
  );

  if (res.status !== 200) {
    throw new Error(await dumpFetchResponse(res));
  }

  return await res.json();
};

const getPosterUrl = (path: string) => {
  return `https://images.igdb.com/igdb/image/upload/t_original/${path}.jpg`;
};

const mapGame = (
  item: z.infer<typeof gameObjectSchema>
): MediaItemMetadata => ({
  mediaType: IGDB.mediaType,
  source: IGDB.name,
  title: item.name,
  igdbId: item.id,
  needsDetails: false,
  releaseDate: item.first_release_date
    ? new Date(item.first_release_date * 1000).toISOString()
    : null,
  overview: item.summary,
  externalPosterUrl: item.cover ? getPosterUrl(item.cover.image_id) : null,
  genres: item.genres ? item.genres.map((genre) => genre.name) : null,
  url: item.websites?.at(0)?.url || null,
  developer: item.involved_companies?.find((item) => item.developer)?.company
    .name,
  platform: item.platforms?.map((value) => value.name),
});

const tokenResponseSchema = z.object({
  access_token: z.string(),
  expires_in: z.number(),
  token_type: z.string(),
});

const gameObjectSchema = z.object({
  id: z.number(),
  cover: z.object({ id: z.number(), image_id: z.string() }).nullish(),
  first_release_date: z.number().nullish(),
  genres: z.array(z.object({ id: z.number(), name: z.string() })).nullish(),
  involved_companies: z
    .array(
      z.object({
        id: z.number(),
        company: z.object({ id: z.number(), name: z.string() }),
        developer: z.boolean(),
      })
    )
    .nullish(),
  name: z.string(),
  platforms: z
    .array(
      z.object({
        id: z.number(),
        name: z.string(),
        platform_logo: z.object({ id: z.number() }).nullish(),
      })
    )
    .nullish(),
  release_dates: z
    .array(
      z.object({
        id: z.number(),
        date: z.number().nullish(),
        platform: z.number().nullish(),
      })
    )
    .nullish(),
  summary: z.string().nullish(),
  websites: z.array(z.object({ id: z.number(), url: z.string() })).nullish(),
});

const searchResponseSchema = z.array(gameObjectSchema);
