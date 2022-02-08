import _ from 'lodash';
import { knex } from 'src/dbconfig';

const omitUndefinedValues = <T extends object>(value: Partial<T>) =>
    _.pickBy(value, (v) => v !== undefined) as Partial<T>;

const BATCH_SIZE = 30;

export const repository = <T extends object>(args: {
    tableName: string;
    primaryColumnName: keyof T;
    columnNames?: ReadonlyArray<keyof T>;
    booleanColumnNames?: ReadonlyArray<keyof T>;
    uniqueBy?: (value: Partial<T>) => Partial<T>;
}) => {
    const {
        primaryColumnName,
        tableName,
        columnNames,
        booleanColumnNames,
        uniqueBy,
    } = args;

    return class Repository {
        public readonly tableName = tableName;
        public readonly columnNames = columnNames;
        public readonly primaryColumnName = primaryColumnName;
        public readonly booleanColumnNames = booleanColumnNames;
        public readonly uniqueBy = uniqueBy;

        public serialize(value: Partial<T>): unknown {
            if (!this.booleanColumnNames) {
                return value;
            }

            return {
                ...value,
                ..._(this.booleanColumnNames)
                    .keyBy()
                    .mapValues((key) =>
                        value[key] !== undefined
                            ? value[key]
                                ? 1
                                : 0
                            : undefined
                    )
                    .value(),
            };
        }

        public deserialize(value: Partial<Record<keyof T, unknown>>): T {
            if (!this.booleanColumnNames) {
                return value as T;
            }

            return {
                ...value,
                ..._(this.booleanColumnNames)
                    .keyBy()
                    .mapValues((key) =>
                        value[key] !== undefined
                            ? Boolean(value[key])
                            : undefined
                    )
                    .value(),
            } as T;
        }

        public stripValue(value: Partial<T>) {
            if (!this.columnNames) {
                return value;
            }

            return _.pick(value, this.columnNames);
        }

        public async count(where?: Partial<T>): Promise<number> {
            const res = await knex(this.tableName)
                .where(omitUndefinedValues(where) || {})
                .count<{ count: number }[]>('* as count')
                .first();

            return Number(res.count);
        }

        public async find(where?: Partial<T>) {
            const res = (await knex<T>(this.tableName).where(
                omitUndefinedValues(where) || {}
            )) as T[];

            if (res) {
                return res.map((value) => this.deserialize(value));
            }
        }

        public async findOne(where?: Partial<T>) {
            const res = (await knex<T>(this.tableName)
                .where(omitUndefinedValues(where) || {})
                .first()) as T;

            if (res) {
                return this.deserialize(res);
            }
        }

        public async delete(where?: Partial<T>) {
            return knex<T>(this.tableName)
                .delete()
                .where(omitUndefinedValues(where) || {});
        }

        public async deleteManyById<A extends typeof args.primaryColumnName>(
            ids: (T extends { [K in A]: infer Type } ? Type : never)[]
        ) {
            return knex(this.tableName)
                .delete()
                .whereIn(primaryColumnName.toString(), ids);
        }

        public async create(value: Partial<T>) {
            if (this.uniqueBy) {
                return this.createUnique(value, this.uniqueBy);
            }

            const res = await knex(this.tableName)
                .insert(
                    this.serialize(omitUndefinedValues(this.stripValue(value)))
                )
                .returning(this.primaryColumnName as string);

            if (res?.length > 0) {
                return res[0][this.primaryColumnName];
            }
        }

        public async createUnique(
            value: Partial<T>,
            uniqueBy: (value: Partial<T>) => Partial<T>
        ) {
            return await knex.transaction(async (trx) => {
                const existingItem = await trx(this.tableName)
                    .where(omitUndefinedValues(uniqueBy(value)))
                    .first();

                if (!existingItem) {
                    const res = await trx(this.tableName)
                        .insert(
                            this.serialize(
                                omitUndefinedValues(this.stripValue(value))
                            )
                        )
                        .returning(this.primaryColumnName as string);

                    if (res?.length > 0) {
                        return res[0][this.primaryColumnName];
                    }
                }
            });
        }

        public async createMany(values: Partial<T>[]) {
            if (values.length === 0) {
                return;
            }

            if (this.uniqueBy) {
                return this.createManyUnique(values, uniqueBy);
            }

            const res = await knex
                .batchInsert(
                    this.tableName,
                    values.map((value) =>
                        this.serialize(
                            omitUndefinedValues(this.stripValue(value))
                        )
                    ),
                    BATCH_SIZE
                )
                .returning(this.primaryColumnName as string);

            res.forEach(
                (value, index) =>
                    (values[index][this.primaryColumnName] =
                        value[this.primaryColumnName])
            );

            return res.map((value) => value[this.primaryColumnName]);
        }

        public async createManyUnique(
            values: Partial<T>[],
            uniqueBy: (value: Partial<T>) => Partial<T>
        ) {
            return await knex.transaction(async (trx) => {
                const existingItems: Partial<T>[] = _.concat(
                    ...(await Promise.all(
                        _.chunk(values, BATCH_SIZE).flatMap((chunk) => {
                            const qb = trx(this.tableName);

                            for (const value of chunk) {
                                qb.orWhere(
                                    omitUndefinedValues(uniqueBy(value))
                                );
                            }
                            return qb;
                        })
                    ))
                );

                const newItems = _(values)
                    .differenceWith(existingItems, (a, b) =>
                        _.isEqual(uniqueBy(a), uniqueBy(b))
                    )
                    .uniqWith((a, b) => _.isEqual(uniqueBy(a), uniqueBy(b)))
                    .value();

                if (newItems.length > 0) {
                    const res = await knex
                        .batchInsert(
                            this.tableName,
                            newItems.map((value) =>
                                this.serialize(
                                    omitUndefinedValues(this.stripValue(value))
                                )
                            ),
                            BATCH_SIZE
                        )
                        .returning(this.primaryColumnName as string)
                        .transacting(trx);

                    res.forEach(
                        (value, index) =>
                            (newItems[index][this.primaryColumnName] =
                                value[this.primaryColumnName])
                    );

                    return res.map((value) => value[this.primaryColumnName]);
                }
            });
        }

        public async update(value: Partial<T>): Promise<Partial<T>> {
            const qb = knex(this.tableName).update(
                this.serialize(omitUndefinedValues(this.stripValue(value)))
            );

            if (value[primaryColumnName]) {
                qb.where(primaryColumnName, value[primaryColumnName]);
            }

            await qb;

            return value;
        }

        public async updateWhere(params: {
            where: Partial<T>;
            value: Partial<T>;
        }) {
            const { value, where } = params;

            await knex(this.tableName)
                .update(
                    this.serialize(omitUndefinedValues(this.stripValue(value)))
                )
                .where(where);
        }

        public async updateOrCreate(params: {
            where: Partial<T>;
            value: Partial<T>;
        }) {
            const { value, where } = params;

            await knex.transaction(async (trx) => {
                const existingItem = await trx(this.tableName)
                    .where(omitUndefinedValues(where))
                    .first();

                if (existingItem) {
                    await trx(this.tableName)
                        .update(
                            this.serialize(
                                omitUndefinedValues(this.stripValue(value))
                            )
                        )
                        .where(
                            primaryColumnName,
                            existingItem[primaryColumnName]
                        );
                } else {
                    await trx(this.tableName).insert(
                        this.serialize(
                            omitUndefinedValues(this.stripValue(value))
                        )
                    );
                }
            });
        }
    };
};
