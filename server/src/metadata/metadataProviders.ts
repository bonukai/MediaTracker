import { MediaItemForProvider, MediaType } from 'src/entity/mediaItem';
import { Audible } from 'src/metadata/provider/audible';
import { IGDB } from 'src/metadata/provider/igdb';
import { OpenLibrary } from 'src/metadata/provider/openlibrary';
import { TMDbMovie, TMDbTv } from 'src/metadata/provider/tmdb';
import _ from 'lodash';
import { MetadataProvider } from 'src/metadata/metadataProvider';
import { MusicBrainz } from './provider/musicbrainz';

const providers = <const>[
  new IGDB(),
  new Audible(),
  new OpenLibrary(),
  new TMDbMovie(),
  new TMDbTv(),
  new MusicBrainz(),
];

class MetadataProviders {
  private readonly metadataProviders = new Map(
    _(providers)
      .groupBy((provider) => provider.mediaType)
      .mapValues(
        (value) => new Map(_.entries(_.keyBy(value, (value) => value.name)))
      )
      .entries()
      .value()
  );

  public has(mediaType: MediaType): boolean {
    return this.metadataProviders.has(mediaType);
  }

  public get(mediaType: MediaType, name?: string): MetadataProvider {
    return name
      ? this.metadataProviders.get(mediaType)?.get(name)
      : this.metadataProviders.get(mediaType)?.values().next().value;
  }

  public details(
    mediaItem: MediaItemForProvider
  ): Promise<MediaItemForProvider> | null {
    return this.get(mediaItem.mediaType, mediaItem.source)?.details(mediaItem);
  }
}

export const metadataProviders = new MetadataProviders();
