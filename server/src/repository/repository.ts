import _, { Dictionary } from 'lodash';
import { knex } from 'src/dbconfig';
import { User } from 'src/entity/user';

const omitUndefinedValues = <T>(
    array: Dictionary<Partial<T>>
): Dictionary<Partial<T>> => _.pickBy(array, (v) => v !== undefined);

export const repository = <T extends object>(args: {
    tableName: string;
    primaryColumnName: keyof T;
    columnNames?: ReadonlyArray<keyof T>;
    booleanColumnNames?: ReadonlyArray<keyof T>;
}) => {
    const { primaryColumnName, tableName, columnNames, booleanColumnNames } =
        args;

    return class Repository {
        public readonly tableName = tableName;
        protected readonly columnNames = columnNames;
        protected readonly primaryColumnName = primaryColumnName;
        protected readonly booleanColumnNames = booleanColumnNames;

        protected serialize(value: Partial<T>): unknown {
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

        protected deserialize(value: Partial<Record<keyof T, unknown>>): T {
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

        protected stripValue(value: Partial<T>) {
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
            const res = await knex(this.tableName)
                .insert(this.serialize(this.stripValue(value)))
                .returning(this.primaryColumnName as string);

            if (res?.length > 0) {
                return res[0][this.primaryColumnName];
            }
        }

        public async createMany(values: Partial<T>[]) {
            if (values.length === 0) {
                return;
            }

            await knex.batchInsert(
                this.tableName,
                values.map((value) => this.serialize(this.stripValue(value))),
                30
            );
        }

        public async update(value: Partial<T>) {
            const qb = knex(this.tableName).update(
                this.serialize(this.stripValue(value))
            );

            if (value[primaryColumnName]) {
                qb.where(primaryColumnName, value[primaryColumnName]);
            }

            await qb;
        }

        public async updateWhere(params: {
            where: Partial<T>;
            value: Partial<T>;
        }) {
            const { value, where } = params;

            await knex(this.tableName)
                .update(this.serialize(this.stripValue(value)))
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
                        .update(this.serialize(this.stripValue(value)))
                        .where(
                            primaryColumnName,
                            existingItem[primaryColumnName]
                        );
                } else {
                    await trx(this.tableName).insert(
                        this.serialize(this.stripValue(value))
                    );
                }
            });
        }
    };
};
