import _ from 'lodash';

import { Database } from '../database.js';
import {
  HomeSectionConfig,
  HomeSectionResponse,
  homeSectionResponseSchema,
} from '../entity/homeSectionModel.js';

export const homeSectionRepository = {
  async get(userId: number): Promise<HomeSectionResponse[]> {
    const homeSection = await Database.knex('homeSection').where(
      'userId',
      userId
    );

    return _(homeSection)
      .sortBy((item) => item.position)
      .map((item) =>
        homeSectionResponseSchema.parse({
          ...item,
          config: JSON.parse(item.configurationJson),
        })
      )
      .value();
  },
  async delete(args: { userId: number; sectionId: number }) {
    const { sectionId, userId } = args;

    await Database.knex.transaction(async (trx) => {
      await trx('homeSection')
        .where('id', sectionId)
        .where('userId', userId)
        .whereNotNull('listId')
        .delete();

      const res = _(await trx('homeSection').where('userId', userId))
        .sortBy((item) => item.position)
        .map((item, index) => ({
          ...item,
          position: index,
        }))
        .value();

      await trx('homeSection').delete();
      await trx('homeSection').insert(res);
    });
  },
  async update(args: {
    userId: number;
    id: number;
    config: HomeSectionConfig;
  }): Promise<void> {
    const { userId, id, config } = args;

    await Database.knex('homeSection')
      .where('id', id)
      .where('userId', userId)
      .update({
        listId: config.type === 'list-view' ? config.listId : null,
        name: config.name,
        configurationJson: JSON.stringify(config),
      });
  },
  async create(args: {
    userId: number;
    config: HomeSectionConfig;
  }): Promise<void> {
    const { userId, config } = args;

    await Database.knex.transaction(async (trx) => {
      const homeSections = await trx('homeSection').where('userId', userId);

      const maxPosition = _.maxBy(homeSections, (item) => item.position)
        ?.position;

      await trx('homeSection').insert({
        userId: userId,
        listId: config.type === 'list-view' ? config.listId : null,
        name: config.name,
        position: maxPosition ? maxPosition + 1 : 0,
        configurationJson: JSON.stringify(config),
      });
    });
  },
  async move(args: {
    userId: number;
    id: number;
    direction: 'up' | 'down';
  }): Promise<void> {
    const { userId, id, direction } = args;

    await Database.knex.transaction(async (trx) => {
      const homeSection = await trx('homeSection').where('userId', userId);
      const targetSection = homeSection.find((item) => item.id === id);

      if (!targetSection) {
        throw new Error(`no homeSection with id ${id} for user ${userId}`);
      }

      const previousSection =
        direction === 'up'
          ? _(homeSection)
              .filter((item) => item.position < targetSection.position)
              .maxBy((item) => item.position)
          : _(homeSection)
              .filter((item) => item.position > targetSection.position)
              .minBy((item) => item.position);

      if (!previousSection) {
        return;
      }

      const res = _(homeSection)
        .map((item) =>
          item.id === targetSection.id
            ? {
                ...item,

                position: previousSection.position,
              }
            : item.id === previousSection.id
              ? {
                  ...item,
                  position: targetSection.position,
                }
              : item
        )
        .sortBy((item) => item.position)
        .map((item, index) => ({
          ...item,
          position: index,
        }))
        .value();

      await trx('homeSection').where('userId', userId).delete();
      await trx('homeSection').insert(res);
    });
  },
} as const;
