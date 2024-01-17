import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('homeSection', (table) => {
    table.increments('id').primary();
    table.integer('userId').references('id').inTable('user').notNullable();
    table.integer('listId').references('id').inTable('list');
    table.integer('position').notNullable();
    table.string('name').notNullable();
    table.text('configurationJson').notNullable();

    table.index(['userId']);
    table.unique(['userId', 'name']);
    table.unique(['userId', 'position']);
  });

  const users = await knex('user');

  const defaultSections = [
    {
      hidden: false,
      type: 'builtin',
      name: 'builtin-section-upcoming',
      position: 0,
    },
    {
      hidden: false,
      type: 'builtin',
      name: 'builtin-section-next-episode-to-watch',
      position: 1,
    },
    {
      hidden: false,
      type: 'builtin',
      name: 'builtin-section-recently-released',
      position: 2,
    },
    {
      hidden: false,
      type: 'builtin',
      name: 'builtin-section-unrated',
      position: 3,
    },
  ];

  await knex.batchInsert(
    'homeSection',
    users.flatMap((user) =>
      defaultSections.map((section) => ({
        userId: user.id,
        name: section.name,
        position: section.position,
        configurationJson: JSON.stringify(section),
      }))
    ),
    30
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('homeSection');
}
