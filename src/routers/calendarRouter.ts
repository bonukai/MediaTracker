import { z } from 'zod';

import { mediaTypeSchema } from '../entity/mediaItemModel.js';
import { mediaItemRepository } from '../repository/mediaItemRepository.js';
import { protectedProcedure, router } from '../router.js';
import { addMonths, parseISO, subMonths } from 'date-fns';
import { SHA256, formatEpisodeNumber } from '../utils.js';
import { iCalBuilder } from '../iCalBuilder.js';
import { rssBuilder } from '../rssBuilder.js';

const calendarInputSchema = z.object({
  from: z
    .string()
    .datetime({ offset: true })
    .default(() => subMonths(new Date(), 2).toISOString()),
  to: z
    .string()
    .datetime({ offset: true })
    .default(() => addMonths(new Date(), 2).toISOString()),
  listId: z.coerce.number().nullish(),
  mediaTypes: z.array(mediaTypeSchema).nullish(),
});

export const calendarRouter = router({
  json: protectedProcedure
    .input(calendarInputSchema)
    .meta({ openapi: { method: 'GET' } })
    .query(async ({ input, ctx }) => {
      const { userId } = ctx;

      return mediaItemRepository.getCalendarItems({
        ...input,
        userId,
      });
    }),
  rss: protectedProcedure
    .input(calendarInputSchema)
    .meta({ openapi: { method: 'GET', contentType: 'application/xml' } })
    .query(async ({ input, ctx }) => {
      const { userId } = ctx;

      const res = await mediaItemRepository.getCalendarItems({
        ...input,
        userId,
      });

      return rssBuilder({
        channel: {
          title: 'MediaTracker',
        },
        items: res.map((item) => ({
          title: item.episode
            ? `${item.mediaItem.title} ${formatEpisodeNumber(item.episode)}`
            : item.mediaItem.title,
          pubDate: parseISO(item.releaseDate),
          guid: SHA256(
            `${item.mediaItem.id}${item.episode?.id}${item.releaseType}`
          ),
        })),
      });
    }),
  iCal: protectedProcedure
    .input(calendarInputSchema)
    .meta({ openapi: { method: 'GET', contentType: 'text/calendar' } })
    .query(async ({ input, ctx }) => {
      const { userId } = ctx;

      const res = await mediaItemRepository.getCalendarItems({
        ...input,
        userId,
      });

      return iCalBuilder({
        name: 'MediaTracer',
        events: res.map((item) => ({
          uid: SHA256(
            `${item.mediaItem.id}${item.episode?.id}${item.releaseType}`
          ),
          start: parseISO(item.releaseDate),
          allDay: true,
          summary: item.episode
            ? `${item.mediaItem.title} ${formatEpisodeNumber(item.episode)}`
            : item.mediaItem.title,
        })),
      });
    }),
});
