import { parseISO } from 'date-fns';
import { z } from 'zod';

export const episodeModelSchema = z.object({
  id: z.number(),
  tvShowId: z.number(),
  seasonId: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  episodeNumber: z.number(),
  seasonNumber: z.number(),
  seasonAndEpisodeNumber: z.number(),
  releaseDate: z.string().nullable(),
  runtime: z.number().nullable(),
  isSpecialEpisode: z.coerce.boolean(),
  tmdbId: z.number().nullable(),
  imdbId: z.string().nullable(),
  tvdbId: z.number().nullable(),
  traktId: z.number().nullable(),
  seasonFinale: z.coerce.boolean().nullable(),
  midSeasonFinale: z.coerce.boolean().nullable(),
});

export type EpisodeModel = z.infer<typeof episodeModelSchema>;

export class TvEpisodeFilters {
  public static nonSpecialEpisodes = (episode: EpisodeModel) => {
    return !episode.isSpecialEpisode;
  };

  public static releasedEpisodes = (episode: EpisodeModel) => {
    return (
      typeof episode.releaseDate === 'string' &&
      episode.releaseDate.trim() != '' &&
      parseISO(episode.releaseDate) <= new Date()
    );
  };

  public static unreleasedEpisodes = (episode: EpisodeModel) => {
    return (
      typeof episode.releaseDate !== 'string' ||
      episode.releaseDate.trim() == '' ||
      parseISO(episode.releaseDate) > new Date()
    );
  };
}
