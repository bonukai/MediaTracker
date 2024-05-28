import { FC, ReactNode, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { Plural, t, Trans } from '@lingui/macro';

import { Button } from '../components/Button';
import { Form } from '../components/Form';
import { ItemsParentContainer } from '../components/ItemsParentContainer';
import { MainTitle } from '../components/MainTitle';
import { SetItemDisplayType } from '../components/SetItemDisplayType';
import { MediaTypeTranslation } from '../components/Translations';
import { useUser } from '../hooks/useUser';
import { trpc } from '../utils/trpc';

import type {
  MediaItemResponse,
  MediaType,
} from '@server/entity/mediaItemModel';
const getFoo = <T extends string>(
  mediaType: MediaType,
  args: Record<T, MediaType[]>
) => {
  return {
    canUse: (key: T) => args[key].includes(mediaType),
    keys: [...Object.keys(args)] as T[],
  };
};

export const SearchPage: FC<{ mediaType: MediaType }> = (props) => {
  const { mediaType } = props;

  return (
    <div className="">
      <MainTitle
        elements={[
          <Trans>Search</Trans>,
          <MediaTypeTranslation mediaType={mediaType} />,
        ]}
      />

      <IgdbInstructions mediaType={mediaType}>
        <SearchPageImpl mediaType={mediaType} />
      </IgdbInstructions>
    </div>
  );
};

const SearchPageImpl: FC<{ mediaType: MediaType }> = (props) => {
  const { mediaType } = props;
  const [searchParams, setSearchParams] = useSearchParams();

  const { canUse, keys } = getFoo(mediaType, {
    query: ['audiobook', 'book', 'movie', 'tv', 'video_game'],
    author: ['audiobook', 'book'],
    narrator: ['audiobook'],
    tmdbId: ['movie', 'tv'],
    imdbId: ['movie', 'tv'],
  });

  const [query, setQuery] = useState({
    query: searchParams.get('query'),
    author: searchParams.get('author'),
    narrator: searchParams.get('narrator'),
    imdbId: searchParams.get('imdbId'),
    tmdbId: parseInt(searchParams.get('tmdbId') || '') || null,
  });

  const searchQuery = trpc.search.search.useQuery(
    {
      query: query,
      mediaType: mediaType,
    },
    {
      enabled:
        keys
          .map((key) => (canUse(key) ? query[key] === null : true))
          .filter((item) => !item).length > 0,
      refetchInterval: 0,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      keepPreviousData: true,
    }
  );

  const [q, setQ] = useState('');

  const localDatabaseSearchQuery = trpc.search.searchLocalDatabase.useQuery(
    {
      title: q,
      mediaType: mediaType,
    },
    {
      enabled: q.length > 0,
      refetchInterval: 0,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      keepPreviousData: q.length > 0,
    }
  );

  return (
    <div className="">
      <Form<{
        query: string;
        author: string;
        narrator: string;
        imdbId: string;
        tmdbId: string;
      }>
        className="flex flex-col gap-5 md:flex-row"
        validation={
          canUse('tmdbId')
            ? {
                tmdbId: (value) => {
                  if (value.length > 0 && isNaN(parseInt(value))) {
                    return {
                      message: t`tmdb id should be a number`,
                    };
                  }
                },
              }
            : undefined
        }
        initialValues={{
          tmdbId: query.tmdbId?.toString() || undefined,
          author: query.author || undefined,
          imdbId: query.imdbId || undefined,
          narrator: query.narrator || undefined,
          query: query.query || undefined,
        }}
        onSubmit={({ data, submitValidation }) => {
          if (
            [
              data.query,
              data.author,
              data.narrator,
              data.tmdbId?.length > 0
                ? !isNaN(parseInt(data.tmdbId || ''))
                : false,
              data.imdbId,
            ].filter(Boolean).length === 0
          ) {
            return submitValidation({
              inputName: 'query',
              required: true,
            });
          }

          const newQuery = {
            query: data.query || null,
            author: data.author || null,
            narrator: data.narrator || null,
            imdbId: data.imdbId || null,
            tmdbId: parseInt(data.tmdbId || '') || null,
          };

          setQuery(newQuery);

          setSearchParams(
            Object.entries(newQuery)
              .map(([key, value]) => [key, value ? value.toString() : null])
              .filter(
                (entry): entry is [string, string] =>
                  typeof entry[1] === 'string'
              )
          );
        }}
      >
        {({ ref }) => (
          <>
            <input
              type="text"
              autoFocus
              className="w-full md:w-80"
              placeholder={t`Query`}
              ref={ref('query')}
              value={q}
              onChange={(e) => {
                setQ(e.currentTarget.value);
                setQuery({
                  author: null,
                  imdbId: null,
                  narrator: null,
                  query: null,
                  tmdbId: null,
                });
              }}
            />

            {canUse('author') && (
              <input
                type="text"
                className="w-full md:w-80"
                aria-label={t`Author`}
                placeholder={t`Author`}
                ref={ref('author')}
              />
            )}
            {canUse('narrator') && (
              <input
                type="text"
                className="w-full md:w-80"
                aria-label={t`Narrator`}
                placeholder={t`Narrator`}
                ref={ref('narrator')}
              />
            )}

            {canUse('tmdbId') && (
              <input
                type="text"
                className="w-full md:w-80"
                aria-label="tmdb"
                placeholder="tmdb"
                ref={ref('tmdbId')}
              />
            )}

            {canUse('imdbId') && (
              <input
                type="text"
                className="w-full md:w-80"
                aria-label="imdb"
                placeholder="imdb"
                ref={ref('imdbId')}
              />
            )}

            <Button
              actionType="submit"
              text={<Trans>Search</Trans>}
              isLoading={searchQuery.isFetching}
              className=""
            />
          </>
        )}
      </Form>

      {searchQuery.isLoading && searchQuery.isFetching && (
        <div className="my-5 text-slate-800">
          <Trans>Loading</Trans>
        </div>
      )}

      {searchQuery.data ? (
        <SearchResultsComponent
          data={searchQuery.data}
          source="metadata-provider"
        />
      ) : (
        <>
          {localDatabaseSearchQuery.data && (
            <SearchResultsComponent
              data={localDatabaseSearchQuery.data}
              source="local-database"
            />
          )}
        </>
      )}
    </div>
  );
};

const IgdbInstructions: FC<{ mediaType: MediaType; children: ReactNode }> = (
  props
) => {
  const { mediaType, children } = props;
  const publicConfigurationQuery = trpc.configuration.getPublic.useQuery();
  const { user } = useUser();

  const isAdmin = user.data?.admin === true;
  const hasIgdbCredentials = publicConfigurationQuery.data?.hasIgdbCredentials;

  if (mediaType === 'video_game' && hasIgdbCredentials === false) {
    return (
      <>
        <Trans>
          Due to IGDB limit of 4 requests per second, IGDB API key is not
          provided with MediaTracker.
        </Trans>

        <br />
        <br />

        {isAdmin ? (
          <Trans>
            It can be acquired{' '}
            <a
              href="https://api-docs.igdb.com/#account-creation"
              className="link"
              target="_blank"
            >
              here
            </a>{' '}
            and updated in{' '}
            <Link to="/settings/configuration" className="link">
              settings/configuration
            </Link>
          </Trans>
        ) : (
          <Trans>
            Contact your MediaTracker's administrator to acquire IGDB API key
          </Trans>
        )}
      </>
    );
  }

  return <>{children}</>;
};

const SearchResultsComponent: FC<{
  data: MediaItemResponse[];
  source: 'local-database' | 'metadata-provider';
}> = (props) => {
  const { data, source } = props;

  return (
    <>
      <div className="my-5 text-slate-800">
        {source === 'local-database' && (
          <Plural
            value={data.length}
            one="found 1 item in local database"
            other="found # items in local database"
          />
        )}

        {source === 'metadata-provider' && (
          <Plural
            value={data.length}
            one="found 1 item in external sources"
            other="found # items in external sources"
          />
        )}
      </div>

      {data.length > 0 && (
        <>
          <div className="my-5">
            <SetItemDisplayType />
          </div>
          <div className="flex flex-col gap-6 md:flex-wrap md:flex-row">
            <ItemsParentContainer
              items={data.map((item) => ({ mediaItem: item }))}
              settings={{ showAddOrRemoveFromWatchlistButton: true }}
            />
          </div>
        </>
      )}
    </>
  );
};
