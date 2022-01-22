import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.schema
        .alterTable('seen', (table) => {
            table.float('date').alter();
        })
        .alterTable('mediaItem', (table) => {
            table.float('lastTimeUpdated').alter();
            table.float('lockedAt').alter();
        })
        .alterTable('userRating', (table) => {
            table.float('date').alter();
        })
        .alterTable('notificationsHistory', (table) => {
            table.float('sendDate').alter();
        })
        .alterTable('sessionKey', (table) => {
            table.float('createdAt').alter();
        });
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema
        .alterTable('seen', (table) => {
            table.bigInteger('date').alter();
        })
        .alterTable('mediaItem', (table) => {
            table.bigInteger('lastTimeUpdated').alter();
            table.bigInteger('lockedAt').alter();
        })
        .alterTable('userRating', (table) => {
            table.bigInteger('date').alter();
        })
        .alterTable('notificationsHistory', (table) => {
            table.bigInteger('sendDate').alter();
        })
        .alterTable('sessionKey', (table) => {
            table.bigInteger('createdAt').alter();
        });
}
// a
