import { parse } from 'csv-parse/sync';
import _ from 'lodash';
import { z } from 'zod';

import { ImportDataType } from '../repository/importRepository.js';
import { mediaItemRepository } from '../repository/mediaItemRepository.js';

export const goodreadsImport = {
  async map(csv: string): Promise<ImportDataType> {
    const data = goodreadsImportSchema.parse(
      parse(csv, {
        delimiter: ',',
        columns: true,
        skip_empty_lines: true,
      })
    );

    const lists = _(data)
      .flatMap((item) => item.Bookshelves)
      .filter((item) => item !== 'to-read' && item !== '')
      .uniq()
      .value();

    await mediaItemRepository.addManyMediaItems({
      mediaItems: data.map((item) => ({
        mediaType: 'book',
        source: 'goodreads',
        title: item.Title,
        authors: [item.Author, ...item['Additional Authors'].split(', ')],
        goodreadsId: item['Book Id'],
        ISBN10: item.ISBN,
        ISBN13: item.ISBN13,
      })),
      mediaType: 'book',
    });

    return {
      ratings: data
        .filter((item) => item['My Rating'] > 0)
        .map((item) => ({
          itemType: 'book',
          rating: item['My Rating']!,
          title: item.Title,
          goodreadsId: item['Book Id'],
          ISBN10: item.ISBN,
          ISBN13: item.ISBN13,
        })),
      watchlist: data
        .filter((item) => item.Bookshelves.includes('to-read'))
        .map((item) => ({
          itemType: 'book',
          title: item.Title,
          goodreadsId: item['Book Id'],
          ISBN10: item.ISBN,
          ISBN13: item.ISBN13,
        })),
      seenHistory: data
        .filter((item) => item['Read Count'] > 0)
        .map((item) => ({
          itemType: 'book',
          seenAt: item['Date Read'] ? new Date(item['Date Read']) : undefined,
          title: item.Title,
          goodreadsId: item['Book Id'],
          ISBN10: item.ISBN,
          ISBN13: item.ISBN13,
        })),
      lists: lists.map((list) => ({
        name: `Goodreads-${list}`,
        items: data
          .filter((item) => item.Bookshelves.includes(list))
          .map((item) => ({
            itemType: 'book',
            title: item.Title,
            goodreadsId: item['Book Id'],
            ISBN10: item.ISBN,
            ISBN13: item.ISBN13,
          })),
      })),
    };
  },
};

const parseGoodreadsIsbn = (value: string) =>
  Number(value.match(/^="(\d+)"$/)?.at(1)) || null;

const goodreadsImportSchema = z.array(
  z.object({
    'Book Id': z.coerce.number(),
    Title: z.string(),
    Author: z.string(),
    'Author l-f': z.string(),
    'Additional Authors': z.string(),
    ISBN: z.string().transform(parseGoodreadsIsbn).nullable(),
    ISBN13: z.string().transform(parseGoodreadsIsbn).nullable(),
    'My Rating': z.coerce.number(),
    'Average Rating': z.coerce.number(),
    Publisher: z.string(),
    Binding: z.string(),
    'Number of Pages': z.coerce.number(),
    'Year Published': z.coerce.number(),
    'Original Publication Year': z.coerce.number(),
    'Date Read': z.string(),
    'Date Added': z.string(),
    Bookshelves: z
      .string()
      .transform((value) => value.split(',').map((item) => item.trim())),
    'Bookshelves with positions': z.string(),
    'Exclusive Shelf': z.string(),
    'My Review': z.string(),
    Spoiler: z.string(),
    'Private Notes': z.string(),
    'Read Count': z.coerce.number(),
    'Owned Copies': z.coerce.number(),
  })
);
