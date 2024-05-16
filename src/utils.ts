import { subMinutes } from 'date-fns';
import _ from 'lodash';
import { customAlphabet } from 'nanoid';
import { createHash } from 'node:crypto';

import { EpisodeResponse, MediaItemModel } from './entity/mediaItemModel.js';
import chalk from 'chalk';
import { EpisodeModel } from './entity/episodeModel.js';

export const getImageId = () => customAlphabet('1234567890abcdef', 32)();

export const splitWhereInQuery = async <T, U>(
  data: T[],
  fn: (data: T[]) => Promise<U[]>
): Promise<U[]> => {
  return _.flatten(
    await Promise.all(_.chunk(data, 500).map((chunk) => fn(chunk)))
  );
};

export const splitDeleteWhereInQuery = async <T, U>(
  data: T[],
  fn: (data: T[]) => Promise<number>
): Promise<number> => {
  return _.sum(await Promise.all(_.chunk(data, 500).map((chunk) => fn(chunk))));
};

export const generateExternalUrl = (mediaItem: MediaItemModel) => {
  if (mediaItem.mediaType === 'tv' || mediaItem.mediaType === 'movie') {
    if (mediaItem.imdbId) {
      return `https://www.imdb.com/title/${mediaItem.imdbId}`;
    }

    if (mediaItem.tmdbId) {
      return `https://www.themoviedb.org/${mediaItem.mediaType}/${mediaItem.tmdbId}`;
    }
  }

  if (mediaItem.mediaType === 'video_game') {
    if (mediaItem.igdbId) {
      return `https://www.igdb.com/games/${mediaItem.title
        .toLowerCase()
        .replaceAll(' ', '-')}`;
    }
  }

  if (mediaItem.mediaType === 'book') {
    if (mediaItem.openlibraryId) {
      return `https://openlibrary.org${mediaItem.openlibraryId}`;
    }
  }

  // if (mediaItem.mediaType === 'audiobook') {
  //   if (mediaItem.audibleId) {
  //     const audibleDomain = new Audible().domain(
  //       mediaItem.audibleCountryCode ||
  //         (GlobalConfiguration.configuration.audibleLang?.toLocaleLowerCase() as AudibleCountryCode)
  //     );

  //     return `https://audible.${audibleDomain}/pd/${mediaItem.audibleId}?overrideBaseCountry=true&ipRedirectOverride=true`;
  //   }
  // }
};

export const is = <T>(item?: T | undefined | null): item is T => {
  return item !== undefined && item !== null;
};

export const withDefinedPropertyFactory = <
  Property extends string | symbol | number,
>(
  property: Property
) => {
  return <ItemType, PropertyType>(
    item: ItemType & { [K in Property]?: PropertyType | null }
  ): item is ItemType & { [K in Property]: PropertyType } => {
    return item[property] !== null && item[property] !== undefined;
  };
};

export const SHA256 = (value: string) => {
  return createHash('sha256').update(value, 'utf-8').digest('hex');
};

export const measure = async <T>(
  description: string,
  fn: () => Promise<T> | T
) => {
  const start = Date.now();
  const res = await fn();
  const end = Date.now();

  console.log(description, `${end - start}ms`);
  return res;
};

export const formatEpisodeNumber = (
  episode: EpisodeResponse | EpisodeModel
): string => {
  return `S${episode.seasonNumber
    .toString()
    .padStart(2, '0')}E${episode.episodeNumber.toString().padStart(2, '0')}`;
};

export const h = (
  literals: TemplateStringsArray,
  ...placeholders: (string | number | undefined | null)[]
) => {
  return literals
    .map(
      (literal, index) =>
        literal +
        (index < placeholders.length
          ? chalk.bold.magenta(placeholders.at(index))
          : '')
    )
    .join('');
};

export const sequentialPromise = async <T, U>(
  data: T[],
  fn: (item: T) => Promise<U>
): Promise<U[]> => {
  const res: U[] = [];

  for (const item of data) {
    res.push(await fn(item));
  }

  return res;
};

export const dumpFetchResponse = async (
  response: Response
): Promise<string> => {
  return [
    `Type: ${response.type}`,
    `URL: ${response.url}`,
    `Status: ${response.status}`,
    `Headers:\n${[...response.headers.entries()]
      .map(([headerName, headerValue]) => `${headerName}: ${headerValue}`)
      .join('\n')}`,
    `Response: ${await response.text()}`,
  ].join('\n\n');
};

export const tryParseDate = (dateStr?: string | null) => {
  if (!dateStr) {
    return;
  }

  const res = new Date(dateStr);

  if (isNaN(res.getTime())) {
    return;
  }

  return res;
};
