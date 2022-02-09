import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.schema
        .createTable('list', (table) => {
            table.increments('id').primary();
            table.string('name').notNullable();
            table.string('privacy').notNullable();
            table.string('sortBy');
            table.string('sortOrder');
            table.text('description');
            table.double('createdAt').notNullable();
            table.double('updatedAt').notNullable();
            table
                .integer('userId')
                .references('id')
                .inTable('user')
                .notNullable();

            table.index('name');
            table.index('userId');
        })
        .createTable('listItem', (table) => {
            table.increments('id').primary();
            table
                .integer('listId')
                .references('id')
                .inTable('list')
                .notNullable();
            table
                .integer('mediaItemId')
                .notNullable()
                .references('id')
                .inTable('mediaItem');
            table.integer('seasonId').references('id').inTable('season');
            table.integer('episodeId').references('id').inTable('episode');
            table.double('addedAt').notNullable();

            table.index('listId');
            table.index('mediaItemId');
            table.index('seasonId');
            table.index('episodeId');
        });
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable('listItem').dropTable('list');
}
