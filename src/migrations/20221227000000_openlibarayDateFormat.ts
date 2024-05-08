import { isValid, parseISO } from 'date-fns';
import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const books = await knex('mediaItem').where({
    source: 'openlibrary',
  });

  for (const book of books) {
    if (book.releaseDate && !isValid(parseISO(book.releaseDate))) {
      await knex('mediaItem')
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

const parseDate = (dateStr: string): string | undefined => {
  if (dateStr.length === 4 && !Number.isNaN(dateStr)) {
    return dateStr;
  }

  const timestamp = Date.parse(dateStr);

  if (!Number.isNaN(timestamp)) {
    const date = new Date(timestamp);
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  }
};
