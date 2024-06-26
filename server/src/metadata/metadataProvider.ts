import _ from 'lodash';

import {
  ExternalIds,
  MediaItemForProvider,
  MediaType,
} from 'src/entity/mediaItem';

export abstract class MetadataProvider<Name extends string = string> {
  public abstract readonly name: Name;
  public abstract readonly mediaType: MediaType;

  /**
   * Search for media
   * @param query
   */
  public abstract search(query: string): Promise<MediaItemForProvider[]>;

  /**
   * Get details for media.
   * @param mediaItem MediaItem
   */
  abstract details(ids: ExternalIds): Promise<MediaItemForProvider>;
}
