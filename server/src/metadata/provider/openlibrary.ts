import axios from 'axios';
import { MediaItemForProvider } from 'src/entity/mediaItem';
import { MetadataProvider } from 'src/metadata/metadataProvider';

export class OpenLibrary extends MetadataProvider {
  readonly name = 'openlibrary';
  readonly mediaType = 'book';

  async search(query: string): Promise<MediaItemForProvider[]> {
    const res = await axios.get('http://openlibrary.org/search.json', {
      params: {
        q: query,
        fields: [
          'key',
          'type',
          'title',
          'first_publish_year',
          'number_of_pages_median',
          'lending_edition_s',
          'edition_key',
          'last_modified_i',
          'first_sentence',
          'language',
          'edition_count',
          'cover_i',
          'author_name',
        ].join(','),
        type: 'work',
        limit: 20,
      },
    });
    const result = res.data as SearchResponse;

    return result.docs?.map((doc) => {
      return {
        mediaType: this.mediaType,
        source: this.name,
        title: doc.title,
        externalPosterUrl: doc.cover_i
          ? `https://covers.openlibrary.org/b/id/${doc.cover_i}.jpg`
          : undefined,
        releaseDate: doc.first_publish_year?.toString(),
        numberOfPages: doc.number_of_pages_median,
        authors: doc.author_name,
        openlibraryId: doc.key,
      };
    });
  }

  async details(args: {
    openlibraryId: string;
    numberOfPages?: number;
    externalPosterUrl?: string;
  }): Promise<MediaItemForProvider> {
    const res = await axios.get<DetailsResponse>(
      `https://openlibrary.org${args.openlibraryId}.json`
    );

    return {
      mediaType: this.mediaType,
      source: this.name,
      title: res.data.title,
      overview:
        typeof res.data.description === 'string'
          ? res.data.description
          : res.data.description?.value,
      releaseDate: parseDate(res.data?.first_publish_date),
      externalPosterUrl:
        res.data.covers?.length > 0
          ? `https://covers.openlibrary.org/b/id/${res.data.covers[0]}.jpg`
          : args.externalPosterUrl,
      numberOfPages: args.numberOfPages,
    };
  }
}

const parseDate = (dateStr: string): string => {
  if (dateStr?.length === 4 && !Number.isNaN(dateStr)) {
    return dateStr;
  }

  const timestamp = Date.parse(dateStr);

  if (!Number.isNaN(timestamp)) {
    const date = new Date(timestamp);
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  }

  return undefined;
};

interface Document {
  cover_i: number;
  first_sentence: string[];
  has_fulltext: boolean;
  title: string;
  title_suggest: string;
  type: string;
  ebook_count_i: number;
  edition_count: number;
  key: string;
  last_modified_i: number;
  cover_edition_key: string;
  first_publish_year: number;
  author_name: string[];
  publish_year: number[];
  author_key: string[];
  seed: string[];
  subject: string[];
  edition_key: string[];
  language: string[];
  lcc: string[];
  lccn: string[];
  publish_place: string[];
  publisher: string[];
  text: string[];
  place: string[];
  publish_date: string[];
  number_of_pages_median?: number;
}

interface SearchResponse {
  start: number;
  num_found: number;
  docs: Document[];
}

interface DetailsResponse {
  description:
    | string
    | {
        type: string;
        value: string;
      };
  title: string;
  covers: number[];
  subject_places: string[];
  subjects: string[];
  subject_people: string[];
  key: string;
  authors: {
    author: {
      key: string;
    };
    type: {
      key: string;
    };
  }[];
  first_publish_date: string;
  subject_times: string[];
  type: {
    key: string;
  };
  latest_revision: number;
  revision: number;
  created: {
    type: string;
    value: string;
  };
  last_modified: {
    type: string;
    value: string;
  };
}
