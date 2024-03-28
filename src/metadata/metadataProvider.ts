import {
  MediaItemMetadata,
  MediaItemModel,
  MediaType,
} from '../entity/mediaItemModel.js';

export type MetadataProvider = {
  readonly name: string;
  readonly mediaType: MediaType;

  search: (args: {
    query?: string | null;
    narrator?: string | null;
    author?: string | null;
    releaseYear?: number | null;
  }) => Promise<MediaItemMetadata[]>;
  details: (mediaItem: Partial<MediaItemModel>) => Promise<MediaItemMetadata>;
  findByTmdbId?: (tmdbId: number) => Promise<MediaItemMetadata | undefined>;
  findByImdbId?: (imdbId: string) => Promise<MediaItemMetadata | undefined>;
  findByTvdbId?: (tvdbId: number) => Promise<MediaItemMetadata | undefined>;
  findByIgdbId?: (igdbId: number) => Promise<MediaItemMetadata | undefined>;
  findByOpenLibraryId?: (
    openLibraryId: string
  ) => Promise<MediaItemMetadata | undefined>;
  findByAudibleId?: (
    audibleId: string
  ) => Promise<MediaItemMetadata | undefined>;
  idsOfItemsToUpdate?: (args: {
    startDate: Date;
    endDate: Date;
  }) => Promise<number[]>;
};

export const metadataProviderFactory = <T extends MetadataProvider>(
  args: T
): { readonly [Key in keyof T]: T[Key] } => {
  return args;
};
