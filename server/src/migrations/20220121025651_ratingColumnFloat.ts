import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.schema.alterTable('userRating', (table) =>
        table.float('rating').alter()
    );
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema.alterTable('userRating', (table) =>
        table.integer('rating').alter()
    );
}
