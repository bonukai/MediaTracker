import busboy from 'busboy';
import { Request } from 'express';
import { logger } from 'src/logger';
import {
  findEpisodeByExternalId,
  findMediaItemByExternalId,
} from 'src/metadata/findByExternalId';
import { seenRepository } from 'src/repository/seen';
import { createExpressRoute } from 'typescript-routes-to-openapi-server';

/**
 * @openapi_tags Lists
 */
export class PlexController {
  /**
   * @openapi_operationId Plex webhook
   */
  post = createExpressRoute<{
    method: 'post';
    path: '/api/plex';
  }>(async (req, res) => {
    const userId = Number(req.user);

    const payload = await getPlexPayload(req);

    if (payload.event === 'media.scrobble') {
      const { imdbId, tmdbId, tvdbId, duration } = parsePlexPayload(payload);

      if (payload.Metadata.type === 'episode') {
        const { mediaItem, episode } = await findEpisodeByExternalId({
          imdbId,
          tmdbId,
          tvdbId,
        });

        if (episode) {
          logger.debug(
            `adding episode ${mediaItem.title} ${episode.seasonNumber}x${episode.episodeNumber} to seen history of user ${userId} with Plex webhook`
          );
          await seenRepository.create({
            userId: userId,
            mediaItemId: mediaItem.id,
            episodeId: episode.id,
            date: Date.now(),
            duration: duration || episode.runtime,
          });
        }
      } else if (payload.Metadata.type === 'movie') {
        const mediaItem = await findMediaItemByExternalId({
          id: {
            imdbId,
            tmdbId,
            tvdbId,
          },
          mediaType: 'movie',
        });

        if (mediaItem) {
          logger.debug(
            `adding movie ${mediaItem.title} to seen history of user ${userId} with Plex webhook`
          );
          await seenRepository.create({
            userId: userId,
            mediaItemId: mediaItem.id,
            date: Date.now(),
            duration: duration || mediaItem.runtime,
          });
        }
      }
    }

    res.sendStatus(200);
  });
}

type PlexPayload = {
  event:
    | 'media.resume'
    | 'media.pause'
    | 'media.play'
    | 'media.rate'
    | 'media.scrobble'
    | 'media.stop';
  Metadata: {
    type: 'episode' | 'movie';
    duration: number;
    Guid: { id: string }[];
  };
};

const getPlexPayload = async (req: Request) => {
  return await new Promise<PlexPayload>((resolve, reject) => {
    const bb = busboy({ headers: req.headers });
    bb.on('field', (name, val) => {
      if (name === 'payload') {
        resolve(JSON.parse(val));
      }
    });
    bb.on('close', () => {
      reject(new Error(`No "payload" filed on Plex webhook body`));
    });
    req.pipe(bb);
  });
};

const parsePlexPayload = (payload: PlexPayload) => {
  const externalIds = payload.Metadata.Guid.map(
    (item) =>
      item.id.match(/^(?<provider>imdb|tmdb|tvdb):\/\/(?<id>\w+)$/)?.groups
  )
    .filter(Boolean)
    .map((match) => ({
      [match.provider]: match.id,
    }))
    .reduce((res, current) => ({ ...res, ...current }));

  const imdbId = externalIds.imdb;
  const tmdbId = Number(externalIds.tmdb) || undefined;
  const tvdbId = Number(externalIds.tvdb) || undefined;

  const duration =
    typeof payload.Metadata.duration === 'number'
      ? payload.Metadata.duration / 1000
      : null;

  return {
    imdbId,
    tmdbId,
    tvdbId,
    duration,
  };
};
