import { protectedProcedure, router } from '../router.js';
import { z } from 'zod';
import { h, isDefined } from '../utils.js';
import { logger } from '../logger.js';

const plexPayloadSchema = z.object({
  payload: z.object({
    event: z.enum([
      'media.resume',
      'media.pause',
      'media.play',
      'media.rate',
      'media.scrobble',
      'media.stop',
    ]),
    Metadata: z.object({
      type: z.enum(['episode', 'movie']),
      duration: z.number(),
      Guid: z.array(
        z.object({
          id: z.string(),
        })
      ),
    }),
    Account: z.object({
      title: z.string(),
      id: z.number(),
    }),
    Server: z.object({
      title: z.string(),
    }),
  }),
  plexUserName: z.string().optional(),
  plexUserId: z.coerce.number().optional(),
});

export const plexProcedure = protectedProcedure
  .meta({
    openapi: {
      method: 'POST',
      alternativePath: '/api/plex',
    },
  })
  .input(plexPayloadSchema)
  .query(async ({ ctx, input }) => {
    const { userId } = ctx;

    const expectedPlexUserId = input.plexUserId;
    const actualPlexUserId = input.payload.Account.id;

    const expectedPlexUserName = input.plexUserName;
    const actualPlexUserName = input.payload.Account.title;

    if (
      typeof expectedPlexUserId === 'number' &&
      actualPlexUserId !== expectedPlexUserId
    ) {
      logger.debug(
        h`skipping plex webhook, plex user id does not match provided id: ${actualPlexUserId} (actual) ≠ ${expectedPlexUserId} (provided)`
      );
      return;
    }

    if (
      typeof expectedPlexUserName === 'string' &&
      actualPlexUserName !== expectedPlexUserName
    ) {
      logger.debug(
        h`skipping plex webhook, plex user name does not match provider name: ${actualPlexUserName} (actual) ≠ ${expectedPlexUserName} (provided)`
      );
      return;
    }

    const externalIds = extractExternalIds(input);

    console.log(externalIds);

    // console.log('plexApiRoute', userId, input);
    return;
  });

const extractExternalIds = (data: z.infer<typeof plexPayloadSchema>) => {
  const { payload } = data;
  const externalIds = payload.Metadata.Guid.map(
    (item) =>
      item.id.match(/^(?<provider>imdb|tmdb|tvdb):\/\/(?<id>\w+)$/)?.groups
  )
    .filter(isDefined)
    .map((match) => ({
      [match.provider]: match.id,
    }))
    .reduce((res, current) => ({ ...res, ...current }));

  const imdbId = externalIds.imdb;
  const tmdbId = Number(externalIds.tmdb) || undefined;
  const tvdbId = Number(externalIds.tvdb) || undefined;

  return {
    imdbId,
    tmdbId,
    tvdbId,
  };
};
