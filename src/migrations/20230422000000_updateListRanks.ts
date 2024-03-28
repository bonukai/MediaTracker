import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const users = await knex('user');

  for (const user of users) {
    const lists = await knex('list')
      .where('userId', user.id)
      .orderBy('rank', 'asc');

    for (const list of lists.map((list, index) => ({ ...list, rank: index }))) {
      await knex('list').update('rank', list.rank).where('id', list.id);
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
export async function down(knex: Knex): Promise<void> {}
