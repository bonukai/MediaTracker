import _ from 'lodash';
import { z } from 'zod';

import { metadataProviderFactory } from '../metadataProvider.js';
import { dumpFetchResponse, tryParseISODate } from '../../utils.js';

export const OpenLibrary = metadataProviderFactory({
  name: 'openlibrary',
  mediaType: 'book',
  async search(args) {
    if (!args.query && !args.author) {
      throw new Error(`at least one of fields: query or author is required`);
    }

    const res = await fetch(
      'http://openlibrary.org/search.json?' +
        new URLSearchParams({
          ...(args.query ? { q: args.query } : {}),
          ...(args.author ? { author: args.author } : {}),
          fields: [
            'key',
            'type',
            'title',
            'first_publish_year',
            'number_of_pages_median',
            'edition_key',
            'last_modified_i',
            'language',
            'edition_count',
            'cover_i',
            'author_name',
          ].join(','),
          type: 'work',
          limit: '20',
        })
    );

    if (res.status !== 200) {
      throw new Error(await dumpFetchResponse(res));
    }
    const data = searchResultSchema.parse(await res.json());

    return data.docs.map((item) => ({
      mediaType: this.mediaType,
      source: this.name,
      title: item.title,
      externalPosterUrl: item.cover_i
        ? `https://covers.openlibrary.org/b/id/${item.cover_i}.jpg`
        : undefined,
      releaseDate: tryParseISODate(
        item.first_publish_year?.toString()
      )?.toISOString(),
      numberOfPages: item.number_of_pages_median,
      authors: item.author_name,
      openlibraryId: item.key,
      needsDetails: true,
    }));
  },
  async details(mediaItem) {
    if (!mediaItem.openlibraryId) {
      throw new Error(
        `unable to retrieve details from OpenLibrary without openlibraryId`
      );
    }

    const res = await fetch(
      `https://openlibrary.org${mediaItem.openlibraryId}.json`
    );

    const data = detailsResponseSchema.parse(await res.json());

    if (!data.title) {
      throw new Error(
        `no details on OpenLibrary for ${mediaItem.openlibraryId}`
      );
    }

    return {
      mediaType: this.mediaType,
      source: this.name,
      title: data.title,
      overview:
        typeof data.description === 'string'
          ? data.description
          : data.description?.value || null,
      releaseDate: parseDate(data?.first_publish_date)?.toISOString(),
      externalPosterUrl: data.covers?.at(0)
        ? `https://covers.openlibrary.org/b/id/${data.covers.at(0)}.jpg`
        : mediaItem.externalPosterUrl,
      numberOfPages: mediaItem.numberOfPages || null,
      authors:
        data.authors
          ?.map((item) =>
            typeof item.author === 'string' ? item.author : item.author?.key
          )
          .filter(_.isString) || null,
    };
  },
  async searchByISBN(isbn: number) {
    const res = await fetch(
      `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=details`
    );

    const data = await res.json();

    // console.log(JSON.stringify(data));

    // return data['ISBN:9780140328721'].details;
    return fooSchema.parse(data)['ISBN:9780140328721'].details;
    return detailsResponseSchema.parse(data);
    // https://openlibrary.org/isbn/9780140328721.json
    // https://openlibrary.org/api/books?bibkeys=ISBN:0385472579&format=json&jscmd=details
    // https://openlibrary.org/api/books?bibkeys=ISBN:0385472579&format=json&jscmd=data
  },
});

const parseDate = (dateStr?: string | null) => {
  if (!dateStr) {
    return;
  }

  if (dateStr?.length === 4 && !Number.isNaN(dateStr)) {
    return new Date(dateStr);
  }

  const timestamp = Date.parse(dateStr);

  if (!Number.isNaN(timestamp)) {
    return new Date(timestamp);
  }
};

const searchResultSchema = z.object({
  docs: z.array(
    z.object({
      key: z.string(),
      type: z.string().nullish(),
      title: z.string(),
      edition_count: z.number().nullish(),
      edition_key: z.array(z.string()).nullish(),
      first_publish_year: z.number().nullish(),
      number_of_pages_median: z.number().nullish(),
      last_modified_i: z.number().nullish(),
      lending_edition_s: z.string().nullish(),
      cover_i: z.number().nullish().nullish(),
      first_sentence: z.array(z.string()).nullish(),
      language: z.array(z.string()).nullish(),
      author_name: z.array(z.string()).nullish(),
    })
  ),
  q: z.string(),
});

const detailsResponseSchema = z.object({
  description: z
    .union([z.string(), z.object({ type: z.string(), value: z.string() })])
    .nullish(),
  type: z.object({ key: z.string() }),
  title: z.string().nullish(),
  first_publish_date: z.string().nullish(),
  authors: z
    .array(
      z.object({
        type: z.union([z.string(), z.object({ key: z.string() })]).nullish(),
        author: z.union([z.string(), z.object({ key: z.string() })]).nullish(),
      }),
      z.object({ key: z.string() })
    )
    .nullish(),
  key: z.string(),
  latest_revision: z.number().nullish(),
  revision: z.number().nullish(),
  covers: z.array(z.number()).nullish(),
  number_of_pages: z.number().nullish(),
});

const fooSchema = z.record(
  z.string(),
  z.object({
    bib_key: z.string(),
    info_url: z.string(),
    preview: z.string(),
    preview_url: z.string(),
    thumbnail_url: z.string(),
    details: z.object({
      identifiers: z.object({
        goodreads: z.array(z.string()).nullish(),
        librarything: z.array(z.string()).nullish(),
      }),
      title: z.string(),
      authors: z.array(z.object({ key: z.string(), name: z.string() })),
      publish_date: z.string().nullish(),
      publishers: z.array(z.string()).nullish(),
      covers: z.array(z.number()).nullish(),
      languages: z.array(z.object({ key: z.string() })).nullish(),
      first_sentence: z.string().nullish(),
      key: z.string(),
      number_of_pages: z.number().nullish(),
      works: z.array(z.object({ key: z.string() })).nullish(),

      isbn_10: z.array(z.string()).nullish(),
      isbn_13: z.array(z.string()).nullish(),
    }),
  })
);

const editionsResponseSchema = z.object({
  links: z.object({ self: z.string(), work: z.string() }),
  size: z.number(),
  entries: z.array(
    z.object({
      publishers: z.array(z.string()),
      identifiers: z
        .object({
          amazon: z.array(z.string()).nullish(),
          goodreads: z.array(z.string()).nullish(),
          librarything: z.array(z.string()).nullish(),
        })
        .nullish(),
      subtitle: z.string().nullish(),
      covers: z.array(z.number()).nullish(),
      physical_format: z.string().nullish(),
      full_title: z.string().nullish(),
      lc_classifications: z.array(z.string()).nullish(),
      key: z.string(),
      authors: z.array(z.object({ key: z.string() })),
      source_records: z.array(z.string()),
      title: z.string(),
      notes: z.object({ type: z.string(), value: z.string() }).nullish(),
      number_of_pages: z.number().nullish(),
      isbn_13: z.array(z.string()).nullish(),
      isbn_10: z.array(z.string()).nullish(),
      publish_date: z.string(),
      works: z.array(z.object({ key: z.string() })),
      type: z.object({ key: z.string() }),
      oclc_numbers: z.array(z.string()).nullish(),
      local_id: z.array(z.string()).nullish(),
      latest_revision: z.number(),
      revision: z.number(),
      created: z.object({ type: z.string(), value: z.string() }),
      last_modified: z.object({ type: z.string(), value: z.string() }),
    })
  ),
});
