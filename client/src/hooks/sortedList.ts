import { useMemo } from 'react';
import { ListItemsResponse, ListSortBy, ListSortOrder } from 'mediatracker-api';

const pastDateOrUndefined = (date?: string) => {
  if (date && date > new Date().toISOString()) {
    return undefined;
  }

  return date;
};

const futureDateOrUndefined = (date?: string) => {
  if (date && date < new Date().toISOString()) {
    return undefined;
  }

  return date;
};

export const useSortedList = (args: {
  sortOrder: ListSortOrder;
  sortBy: ListSortBy;
  listItems?: ListItemsResponse;
}) => {
  const { sortBy, sortOrder, listItems } = args;

  return useMemo(() => {
    if (!listItems) {
      return;
    }

    const sortFunctionFactory = <T>(
      property: (listItem: ListItem) => T,
      comparator: (a: T, b: T) => number
    ) => {
      return (a: ListItem, b: ListItem): number => {
        const propertyA = property(a);
        const propertyB = property(b);

        if (
          (propertyA === null || propertyA === undefined) &&
          (propertyB === null || propertyB === undefined)
        ) {
          return a.mediaItem.title.localeCompare(b.mediaItem.title);
        }

        if (propertyA === null || propertyA === undefined) {
          return 1;
        }

        if (propertyB === null || propertyB === undefined) {
          return -1;
        }

        if (propertyA === propertyB) {
          // Tv Show and season before episode
          if (!a.episode && b.episode) {
            return -1;
          }

          if (!b.episode && a.episode) {
            return 1;
          }

          // Season after Tv Show
          if (!a.season && b.season) {
            return -1;
          }

          if (!b.season && a.season) {
            return 1;
          }

          // Order episodes
          if (a.episode && b.episode) {
            return (
              a.episode.seasonAndEpisodeNumber -
              b.episode.seasonAndEpisodeNumber
            );
          }

          // Order seasons
          if (a.season && b.season) {
            return a.season.seasonNumber - b.season.seasonNumber;
          }

          return a.mediaItem.title.localeCompare(b.mediaItem.title);
        }

        if (sortOrder === 'asc') {
          return comparator(propertyA, propertyB);
        } else if (sortOrder === 'desc') {
          return comparator(propertyB, propertyA);
        }
      };
    };

    const sortFunctions: Record<
      ListSortBy,
      (a: ListItem, b: ListItem) => number
    > = {
      'release-date': sortFunctionFactory(
        (listItem) =>
          listItem.episode
            ? listItem.episode.releaseDate
            : listItem.season
            ? listItem.season.releaseDate
            : listItem.mediaItem.releaseDate,
        stringComparator
      ),
      'recently-watched': sortFunctionFactory(
        (listItem) =>
          listItem.episode
            ? listItem.episode.lastSeenAt
            : listItem.season
            ? listItem.season.lastSeenAt
            : listItem.mediaItem.lastSeenAt,
        numericComparator
      ),
      'recently-aired': sortFunctionFactory(
        (listItem) =>
          pastDateOrUndefined(
            listItem.episode
              ? listItem.episode.releaseDate
              : listItem.season
              ? listItem.season.releaseDate
              : listItem.mediaItem.mediaType === 'tv'
              ? listItem.mediaItem.lastAiredEpisode?.releaseDate
              : listItem.mediaItem.releaseDate
          ),
        stringComparator
      ),
      'next-airing': sortFunctionFactory(
        (listItem) =>
          futureDateOrUndefined(
            listItem.episode
              ? listItem.episode.releaseDate
              : listItem.season
              ? listItem.season.releaseDate
              : listItem.mediaItem.mediaType === 'tv'
              ? listItem.mediaItem.upcomingEpisode?.releaseDate
              : listItem.mediaItem.releaseDate
          ),
        stringComparator
      ),
      runtime: sortFunctionFactory(
        (listItem) =>
          listItem.episode
            ? listItem.episode.runtime
            : listItem.season
            ? listItem.season.totalRuntime
            : listItem.mediaItem.totalRuntime,
        numericComparator
      ),
      'my-rating': sortFunctionFactory(
        (listItem) =>
          listItem.episode
            ? listItem.episode.userRating?.rating
            : listItem.season
            ? listItem.season.userRating?.rating
            : listItem.mediaItem.userRating?.rating,
        numericComparator
      ),
      'recently-added': sortFunctionFactory(
        (listItem) => listItem.listedAt,
        stringComparator
      ),
      title: sortFunctionFactory(
        (listItem) => listItem.mediaItem.title,
        stringComparator
      ),
    };

    return listItems.sort(sortFunctions[sortBy]);
  }, [sortOrder, listItems, sortBy]);
};

type ListItem = ListItemsResponse extends Array<infer T> ? T : never;

const stringComparator = (a: string, b: string) => a.localeCompare(b);
const numericComparator = (a: number, b: number) => a - b;
