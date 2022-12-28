import { isValid, parseISO } from 'date-fns';
import { Knex } from 'knex';
import { MediaItemBase } from 'src/entity/mediaItem';

export async function up(knex: Knex): Promise<void> {
  const books = await knex<MediaItemBase>('mediaItem').where({
    source: 'openlibrary',
  });

  for (const book of books) {
    if (book.releaseDate && !isValid(parseISO(book.releaseDate))) {
      await knex<MediaItemBase>('mediaItem')
        .update({
          releaseDate: parseDate(book.releaseDate),
        })
        .where({
          id: book.id,
        });
    }
  }
}

export async function down(knex: Knex): Promise<void> {
  return;
}

const parseDate = (dateStr: string): string => {
  if (dateStr.length === 4 && !Number.isNaN(dateStr)) {
    return dateStr;
  }

  const timestamp = Date.parse(dateStr);

  if (!Number.isNaN(timestamp)) {
    const date = new Date(timestamp);
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  }

  return undefined;
};
