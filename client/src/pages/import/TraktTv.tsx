import React, { FunctionComponent, useEffect, useState } from 'react';
import { useMutation, useQuery } from 'react-query';
import { useSpring, animated } from 'react-spring';
import { Plural, t, Trans } from '@lingui/macro';

import { mediaTrackerApi } from 'src/api/api';
import {
  ImportState,
  ImportTrakttv,
  TraktTvImportNotImportedItems,
} from 'mediatracker-api';
import { TvImportSummaryTable } from 'src/components/ImportSummaryTable';
import { queryClient } from 'src/App';

const useTraktTvImport = () => {
  const [_state, setState] = useState<ImportState>();

  const { data: deviceCode } = useQuery(
    ['import', 'TraktTv', 'device-code'],
    mediaTrackerApi.importTrakttv.deviceToken
  );

  const [state, setStateResponse] =
    useState<ImportTrakttv.State.ResponseBody>();

  useEffect(() => {
    const events = new EventSource('/api/import-trakttv/state-stream');

    events.onmessage = (event) => {
      setStateResponse(JSON.parse(event.data));
    };

    return () => {
      events.close();
    };
  }, []);

  const startOverMutation = useMutation(
    () => mediaTrackerApi.importTrakttv.startOver(),
    {
      onSettled: () => {
        setState(undefined);
        queryClient.removeQueries(['import', 'TraktTv']);
        queryClient.invalidateQueries(['import', 'TraktTv']);
      },
    }
  );

  return {
    deviceCode,
    state,
    startOver: startOverMutation.mutate,
  };
};

export const TraktTvImportPage: FunctionComponent = () => {
  const { deviceCode, state, startOver } = useTraktTvImport();

  return (
    <div className="flex flex-col justify-center w-full mt-4">
      <div className="flex flex-col items-center w-full">
        {state ? (
          <>
            {deviceCode && state?.state === 'waiting-for-authentication' ? (
              <div className="flex flex-col items-center mt-10">
                <div>
                  <Trans>
                    Go to{' '}
                    <a
                      href={deviceCode.verificationUrl}
                      className="link"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {deviceCode.verificationUrl}
                    </a>{' '}
                    and enter following code: <b>{deviceCode.userCode}</b>
                  </Trans>
                </div>
                {navigator.clipboard && (
                  <div>
                    <div
                      className="mt-2 text-sm btn"
                      onClick={async () => {
                        try {
                          navigator.clipboard.writeText(deviceCode.userCode);
                        } catch (error) {
                          console.log(error);
                        }
                      }}
                    >
                      <Trans>Copy to clipboard</Trans>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="text-2xl">{stateMap[state.state]}</div>
                {state.error && (
                  <div className="mt-2 text-red-500">{state.error}</div>
                )}
              </>
            )}

            {state.state === 'imported' && (
              <>
                <div className="mt-2 btn" onClick={() => startOver()}>
                  <Trans>Start over</Trans>
                </div>
              </>
            )}
          </>
        ) : (
          <Trans>Loading</Trans>
        )}
        <div className="py-4">
          {state?.progress > 0 && (
            <ProgressBarComponent progress={state.progress} />
          )}
        </div>

        {state?.exportSummary && (
          <TraktImportSummaryTableComponent state={state} />
        )}

        {state?.notImportedItems && (
          <NotImportedItems notImportedItems={state.notImportedItems} />
        )}
      </div>
    </div>
  );
};

const stateMap: Record<ImportState, string> = {
  exporting: t`Exporting`,
  uninitialized: t`Uninitialized`,
  'updating-metadata': t`Updating metadata`,
  'waiting-for-authentication': t`Waiting for authentication`,
  imported: t`Imported`,
  importing: t`Importing`,
  error: t`Error`,
};

const ProgressBarComponent: FunctionComponent<{ progress: number }> = (
  props
) => {
  const progress = props.progress * 100;

  const style = useSpring({
    background: `linear-gradient(to right, blue ${progress}%, transparent 0%)`,
    from: { background: 'linear-gradient(to right, blue 0%, transparent 0%)' },
  });

  return (
    <animated.div
      className="block h-4 border rounded w-80 bg-grad"
      style={style}
    ></animated.div>
  );
};

const TraktImportSummaryTableComponent: FunctionComponent<{
  state: ImportTrakttv.State.ResponseBody;
}> = (props) => {
  const { state } = props;

  const importedListsByTraktId =
    state.importSummary?.lists.reduce(
      (prev, current) => ({ [current.listId]: current, ...prev }),
      {}
    ) || {};

  return (
    <TvImportSummaryTable
      rows={[
        {
          title: t`Watchlist`,
          exported: {
            movies: state.exportSummary?.watchlist?.movies,
            shows: state.exportSummary?.watchlist?.shows,
            seasons: state.exportSummary?.watchlist?.seasons,
            episodes: state.exportSummary?.watchlist?.episodes,
          },
          imported: {
            movies: state.importSummary?.watchlist?.movies,
            shows: state.importSummary?.watchlist?.shows,
            seasons: state.importSummary?.watchlist?.seasons,
            episodes: state.importSummary?.watchlist?.episodes,
          },
        },
        {
          title: t`Seen history`,
          exported: {
            movies: state.exportSummary?.seen?.movies,
            episodes: state.exportSummary?.seen?.episodes,
          },
          imported: {
            movies: state.importSummary?.seen?.movies,
            episodes: state.importSummary?.seen?.episodes,
          },
        },
        {
          title: t`Ratings`,
          exported: {
            movies: state.exportSummary?.ratings?.movies,
            shows: state.exportSummary?.ratings?.shows,
            seasons: state.exportSummary?.ratings?.seasons,
            episodes: state.exportSummary?.ratings?.episodes,
          },
          imported: {
            movies: state.importSummary?.ratings?.movies,
            shows: state.importSummary?.ratings?.shows,
            seasons: state.importSummary?.ratings?.seasons,
            episodes: state.importSummary?.ratings?.episodes,
          },
        },
        ...state.exportSummary?.lists?.map((list) => ({
          key: list.listId,
          title: t`List: ${list.listName}`,
          exported: {
            movies: list?.movies,
            shows: list?.shows,
            seasons: list?.seasons,
            episodes: list?.episodes,
          },
          imported: {
            movies: importedListsByTraktId[list.listId]?.movies,
            shows: importedListsByTraktId[list.listId]?.shows,
            seasons: importedListsByTraktId[list.listId]?.seasons,
            episodes: importedListsByTraktId[list.listId]?.episodes,
          },
        })),
      ]}
    />
  );
};

const NotImportedItems: FunctionComponent<{
  notImportedItems: TraktTvImportNotImportedItems;
}> = (props) => {
  const { notImportedItems } = props;

  console.log(notImportedItems.watchlist.shows.filter(item => item.year == 2016))
  return (
    <>
      <div className="mt-8 text-2xl font-bold">
        <Trans>Not imported items</Trans>
      </div>
      <div className="self-start">
        <Foo
          title={t`Watchlist - movies`}
          items={notImportedItems.watchlist.movies?.map(formatTitle)}
        />

        <Foo
          title={t`Watchlist - shows`}
          items={notImportedItems.watchlist.shows?.map(formatTitle)}
        />

        <Foo
          title={t`Watchlist - season`}
          items={notImportedItems.watchlist.seasons?.map(formatSeasonTitle)}
        />

        <Foo
          title={t`Watchlist - episodes`}
          items={notImportedItems.watchlist.episodes?.map(formatEpisodeTitle)}
        />

        <Foo
          title={t`Seen history - movies`}
          items={notImportedItems.seen.movies?.map(formatTitle)}
        />

        <Foo
          title={t`Seen history - episodes`}
          items={notImportedItems.seen.episodes?.map(formatEpisodeTitle)}
        />

        <Foo
          title={t`Ratings - movies`}
          items={notImportedItems.ratings.movies?.map(formatTitle)}
        />

        <Foo
          title={t`Ratings - shows`}
          items={notImportedItems.ratings.shows?.map(formatTitle)}
        />

        <Foo
          title={t`Ratings - seasons`}
          items={notImportedItems.ratings.seasons?.map(formatSeasonTitle)}
        />

        <Foo
          title={t`Ratings - episodes`}
          items={notImportedItems.ratings.episodes?.map(formatEpisodeTitle)}
        />

        {notImportedItems.lists?.map((item) => (
          <div key={item.listId}>
            <Foo
              key={item.listId}
              title={t`List ${item.listName} - movies`}
              items={item.movies?.map(formatTitle)}
            />

            <Foo
              key={item.listId}
              title={t`List ${item.listName} - shows`}
              items={item.shows?.map(formatTitle)}
            />

            <Foo
              key={item.listId}
              title={t`List ${item.listName} - seasons`}
              items={item.seasons?.map(formatSeasonTitle)}
            />

            <Foo
              key={item.listId}
              title={t`List ${item.listName} - episodes`}
              items={item.episodes?.map(formatEpisodeTitle)}
            />
          </div>
        ))}
      </div>
    </>
  );
};

const Foo: FunctionComponent<{ items: string[]; title: string }> = (props) => {
  const { items, title } = props;

  return (
    <>
      {items?.length > 0 && (
        <>
          <div className="mt-4 text-xl font-bold">
            {title} (
            <Plural value={items.length} one="1 item" other="# items" />)
          </div>

          {items?.map((item) => (
            <div key={item}>{item}</div>
          ))}
        </>
      )}
    </>
  );
};

const formatTitle = (args: { title: string; year?: number }) => {
  const { title, year } = args;

  if (!year) {
    return title;
  }

  return `${title} (${year})`;
};

const formatSeasonTitle = (args: {
  show: { title: string; year?: number };
  season: { seasonNumber: number };
}) => {
  return `${formatTitle(args.show)} S${args.season.seasonNumber
    .toString()
    .padStart(2, '0')}`;
};

const formatEpisodeTitle = (args: {
  show: { title: string; year?: number };
  episode: { seasonNumber: number; episodeNumber: number };
}) => {
  return `${formatTitle(args.show)} S${args.episode.seasonNumber
    .toString()
    .padStart(2, '0')}E${args.episode.episodeNumber
    .toString()
    .padStart(2, '0')}`;
};
