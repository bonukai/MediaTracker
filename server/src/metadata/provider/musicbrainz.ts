import axios from 'axios';

import { MediaItemForProvider, ExternalIds } from 'src/entity/mediaItem';
import { MetadataProvider } from 'src/metadata/metadataProvider';

export class MusicBrainz extends MetadataProvider {
  readonly name = 'musicbrainz';
  readonly mediaType = 'music';

  async search(query: string): Promise<MediaItemForProvider[]> {

    const escaped_query = query.replace(" ", "%20")

    const res = await axios.get<MusicBrainzResponse.SearchResult>(
      `http://musicbrainz.org/ws/2/release-group?query=release:${query}`, // FIXME
    );

    if (res.status === 200) {
      return res.data['release-groups'].map((product) =>
        this.mapResponse(product)
      );
    }

    throw new Error(`Error: ${res.status}`);ODO
  }

  async details(args: {
    musicBrainzId: string;
  }): Promise<MediaItemForProvider> {
    const res = await axios.get<MusicBrainzResponse.DetailsResult>(
    `http://musicbrainz.org/ws/2/release-group/${args.musicBrainzId}?inc=artist-credits+releases+genres`
    );

    return {
      mediaType: this.mediaType,
      source: this.name,
      title: res.data.title,
      url: `https://musicbrainz.org/release-group/${args.musicBrainzId}`,
      externalPosterUrl: `https://coverartarchive.org/release-group/${args.musicBrainzId}/front`,
      genres: res.data.genres.map(genre => genre.name)
    };
  }

  private mapResponse(
    item: MusicBrainzResponse.ReleaseGroup,
  ): MediaItemForProvider {

    return {
        mediaType: this.mediaType,
        title: item.title,
        needsDetails: true,
        releaseDate: item["first-release-date"],
        source: this.name,
        authors: item["artist-credit"].map(artist => artist.name),
        musicBrainzId: item.id,
        externalPosterUrl: `https://coverartarchive.org/release-group/${item.id}/front`,
    };
  }
}

namespace MusicBrainzResponse {

    export interface ArtistInfo {
      id: string;
      name: string;
      'sort-name': string;
      disambiguation: string;
    }

    export interface ArtistCredit {
      name: string;
      artist: ArtistInfo;
    }

    export interface Release {
      id: string;
      'status-id': string;
      title: string;
      status: string;
      date: string;
      country: string;
    }

    export interface Tag {
      count: number;
      name: string;
    }

    export interface Genre {
      count: number;
      name: string;
      disambiguation: string;
      id: string;
    }

    export interface ReleaseGroup {
      id: string;
      score: number;
      'primary-type-id': string;
      count: number;
      title: string;
      'first-release-date': string,
      'primary-type': string,
      'secondary-types'?: string[],
      'secondary-type-ids'?: string[],
      'artist-credit': ArtistCredit[],
      releases: Release[],
      tags: Tag[]
    }

    export interface SearchResult {
      created: Date;
      count: number;
      offset: number;
      'release-groups': ReleaseGroup[];
    }

    export interface DetailsResult {
      'primary-type-id': string;
      'artist-credit': ArtistCredit[];
      'first-release-date': string;
      'secondary-types': string[];
      id: string;
      disambiguation: string;
      releases: Release[];
      'primary-type': string;
      title: string;
      'secondary-type-ids': string[];
      genres: Genre[]
    }
  }
