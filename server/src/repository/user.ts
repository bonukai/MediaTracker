import argon2 from 'argon2';
import _ from 'lodash';

import { Database } from 'src/dbconfig';
import { User, userColumns, userNonSensitiveColumns } from 'src/entity/user';
import { repository } from 'src/repository/repository';
import { randomSlugId, toSlug } from 'src/slug';

class UserRepository extends repository<User>({
  tableName: 'user',
  columnNames: userColumns,
  primaryColumnName: 'id',
  booleanColumnNames: <const>[
    'admin',
    'publicReviews',
    'sendNotificationForEpisodesReleases',
    'sendNotificationForReleases',
    'sendNotificationWhenNumberOfSeasonsChanges',
    'sendNotificationWhenReleaseDateChanges',
    'sendNotificationWhenStatusChanges',
    'hideEpisodeTitleForUnseenEpisodes',
    'hideOverviewForUnseenSeasons',
  ],
}) {
  public async find(where: Partial<User>): Promise<User[]> {
    const res = (await Database.knex<User>(this.tableName)
      .where(where)
      .select(userNonSensitiveColumns)) as User[];

    if (res) {
      return res.map((value) => this.deserialize(value));
    }
  }

  public async findOne(where: Partial<User>): Promise<User> {
    const res = (await Database.knex<User>(this.tableName)
      .where(where)
      .select(userNonSensitiveColumns)
      .first()) as unknown as User;

    if (res) {
      return this.deserialize(res);
    }
  }

  public async findUsersWithMediaItemOnWatchlist(args: {
    mediaItemId: number;
    sendNotificationForReleases?: boolean;
    sendNotificationForEpisodesReleases?: boolean;
  }): Promise<User[]> {
    const {
      mediaItemId,
      sendNotificationForReleases,
      sendNotificationForEpisodesReleases,
    } = args;
    const qb = Database.knex(this.tableName)
      .leftJoin('watchlist', 'watchlist.userId', 'user.id')
      .where('watchlist.mediaItemId', mediaItemId)
      .whereNotNull('watchlist.id')
      .select(
        userNonSensitiveColumns.map((column) => this.tableName + '.' + column)
      );

    if (sendNotificationForReleases) {
      qb.where('sendNotificationForReleases', 1);
    }

    if (sendNotificationForEpisodesReleases) {
      qb.where('sendNotificationForEpisodesReleases', 1);
    }

    return await qb;
  }

  public async usersWithMediaItemOnWatchlist(
    mediaItemId: number
  ): Promise<User[]> {
    return await Database.knex(this.tableName)
      .leftJoin('watchlist', 'watchlist.userId', 'user.id')
      .where('watchlist.mediaItemId', mediaItemId)

      .whereNotNull('watchlist.id')
      .select(
        userNonSensitiveColumns.map((column) => this.tableName + '.' + column)
      );
  }

  public async findOneWithPassword(where: Partial<User>): Promise<User> {
    return await Database.knex<User>(this.tableName).where(where).first();
  }

  public async create(user: Omit<User, 'id' | 'slug'>) {
    user.password = await argon2.hash(user.password);
    const slug = toSlug(user.name);

    const [res] = await Database.knex<User>('user').insert(
      {
        ..._.pick(user, this.columnNames),

        slug: Database.knex.raw(
          `(CASE 
              WHEN (
                ${Database.knex<User>('user')
                  .count()
                  .where('slug', slug)
                  .toQuery()}) = 0 
                THEN '${slug}' 
              ELSE '${slug}-${randomSlugId()}' 
            END)`
        ),
      },
      'id'
    );

    return res.id;
  }

  public async update(user: Partial<User>) {
    const result = _.cloneDeep(user);

    if (result.password) {
      result.password = await argon2.hash(result.password);
    }

    return await super.update(result);
  }

  public async verifyPassword(user: User, password: string) {
    return await argon2.verify(user.password, password);
  }
}

export const userRepository = new UserRepository();
