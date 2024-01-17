import { z } from 'zod';

export const seasonModelSchema = z.object({
  id: z.number(),
  description: z.string().nullable(),
  numberOfEpisodes: z.number().nullable(),
  externalPosterUrl: z.string().nullable(),
  posterId: z.string().nullable(),
  releaseDate: z.string().nullable(),
  tvShowId: z.number(),
  title: z.string(),
  seasonNumber: z.number(),
  isSpecialSeason: z.boolean(),
  tmdbId: z.number().nullable(),
  tvdbId: z.number().nullable(),
  traktId: z.number().nullable(),
});

export type SeasonModel = z.infer<typeof seasonModelSchema>;
