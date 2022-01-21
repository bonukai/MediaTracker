import _ from 'lodash';
import { knex } from 'src/dbconfig';
import { Watchlist } from 'src/entity/watchlist';
import { repository } from 'src/repository/repository';

class WatchlistRepository extends repository<Watchlist>({
    tableName: 'watchlist',
    primaryColumnName: 'id',
}) {
    public async create(value: Partial<Watchlist>): Promise<any> {
        return await knex.transaction(async (trx) => {
            const existingItem = await trx(this.tableName)
                .where({
                    userId: value.userId,
                    mediaItemId: value.mediaItemId,
                })
                .first();

            if (!existingItem) {
                const res = await trx(this.tableName)
                    .insert({
                        userId: value.userId,
                        mediaItemId: value.mediaItemId,
                    })
                    .returning(this.primaryColumnName as string);

                if (res?.length > 0) {
                    return res[0][this.primaryColumnName];
                }
            }
        });
    }

    public async createMany(values: Partial<Watchlist>[]): Promise<void> {
        return await knex.transaction(async (trx) => {
            const qb = trx<Watchlist>(this.tableName);

            for (const value of values) {
                qb.orWhere({
                    userId: value.userId,
                    mediaItemId: value.mediaItemId,
                });
            }
            const existingItems = await qb;
            const newItems = _.differenceWith(
                values,
                existingItems,
                (a, b) =>
                    a.mediaItemId === b.mediaItemId && a.userId === b.userId
            );

            if (newItems.length > 0) {
                        this.tableName,
            }
        });
    }
}

export const watchlistRepository = new WatchlistRepository();
