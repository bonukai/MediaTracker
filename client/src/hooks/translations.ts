import { t } from '@lingui/macro';
import { ListSortBy, SortOrder } from 'mediatracker-api';

import { useTranslatedKeysFactory } from 'src/hooks/translatedKeysFactory';

export const useListSortByKeys = () =>
  useTranslatedKeysFactory<ListSortBy>({
    'my-rating': t`My rating`,
    'recently-added': t`Recently added`,
    'recently-watched': t`Recently watched`,
    'recently-aired': t`Recently aired`,
    'release-date': t`Release date`,
    runtime: t`Runtime`,
    title: t`Title`,
    rank: t`Rank`,
    'next-airing': t`Next airing`,
  });

export const useListPrivacyKeys = () =>
  useTranslatedKeysFactory({
    private: t`Private`,
    public: t`Public`,
  });

export const useSortOrderKeys = () =>
  useTranslatedKeysFactory<SortOrder>({
    asc: t`Ascending`,
    desc: t`Descending`,
  });
