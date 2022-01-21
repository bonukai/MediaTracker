import React, { FunctionComponent, useState } from 'react';
import { useMutation, useQuery } from 'react-query';
import { Navigate } from 'react-router-dom';
import { mediaTrackerApi } from 'src/api/api';
import { queryClient } from 'src/App';
import { GridItem } from 'src/components/GridItem';

const useTraktTvImport = () => {
  const [isAuthenticatedState, setIsAuthenticatedState] = useState(false);

  const { data: deviceCode, isLoading: deviceCodeLoading } = useQuery(
    ['traktTvImport', 'device-code'],
    mediaTrackerApi.importTrakttv.deviceToken
  );

  const { data: isAuthenticated, isLoading: isAuthenticatedLoading } = useQuery(
    ['traktTvImport', 'is-authenticated'],
    mediaTrackerApi.importTrakttv.isAuthenticated,
    {
      enabled: deviceCode != null && !isAuthenticatedState,
      refetchInterval: deviceCode != null ? 100 : false,
      onSuccess: (data) => setIsAuthenticatedState(data),
    }
  );

  const { data: itemsToImport, isLoading: itemsToImportLoading } = useQuery(
    ['traktTvImport', 'items-to-import'],
    mediaTrackerApi.importTrakttv.itemsToImport,
    {
      enabled: isAuthenticatedState === true,
    }
  );

  const importMutation = useMutation(mediaTrackerApi.importTrakttv.import, {
    onSuccess: () => {
      setIsAuthenticatedState(false);
      queryClient.removeQueries(['traktTvImport']);
    },
  });

  return {
    deviceCode,
    isAuthenticated,
    itemsToImport,
    importItems: importMutation.mutate,
    importItemsLoading: importMutation.isLoading,
    importItemsSuccess: importMutation.isSuccess,
  };
};

export const TraktTvImportPage: FunctionComponent = () => {
  const {
    deviceCode,
    isAuthenticated,
    itemsToImport,
    importItems,
    importItemsLoading,
    importItemsSuccess,
  } = useTraktTvImport();

  if (importItemsSuccess) {
    return <Navigate to="/" />;
  }

  return (
    <div className="flex justify-center w-full">
      {isAuthenticated ? (
        <>
          {!itemsToImport ? (
            <>Fetching items</>
          ) : (
            <>
              <div className="flex flex-row flex-wrap items-grid">
                <div className="flex flex-col header">
                  <div className="text-2xl ">
                    Following items will be added to MediaTracker
                  </div>

                  <button
                    className="self-center mt-3 mb-1 btn-blue"
                    onClick={() => importItems({})}
                    disabled={importItemsLoading}
                  >
                    Import
                  </button>
                  {importItemsLoading && (
                    <div className="my-2 text-xl">
                      Importing items, please wait
                    </div>
                  )}
                </div>

                <div className="text-2xl header">Watchlist</div>

                {itemsToImport.watchlist.map((item) => (
                  <GridItem
                    key={item.id}
                    mediaItem={item}
                    appearance={{
                      showFirstUnwatchedEpisode: false,
                      showNextAiring: false,
                      showRating: false,
                      showAddToWatchlistAndMarkAsSeenButtons: false,
                      topBar: {
                        showFirstUnwatchedEpisodeBadge: false,
                        showOnWatchlistIcon: false,
                        showUnwatchedEpisodesCount: false,
                      },
                    }}
                  />
                ))}

                <div className="text-2xl header">Seen</div>

                {itemsToImport.seen.map((item) => (
                  <GridItem key={item.id} mediaItem={item} />
                ))}
              </div>
            </>
          )}
        </>
      ) : (
        <>
          {deviceCode ? (
            <div className="">
              Go to{' '}
              <a
                href={deviceCode.verificationUrl}
                className="text-blue-800 underline dark:text-blue-400"
                target="_blank"
                rel="noopener noreferrer"
              >
                {deviceCode.verificationUrl}
              </a>{' '}
              and enter following code: {deviceCode.userCode}
              <div
                className="ml-2 text-sm btn"
                onClick={() => {
                  navigator.permissions
                    .query({ name: 'clipboard-write' as PermissionName })
                    .then((result) => {
                      if (
                        result.state == 'granted' ||
                        result.state == 'prompt'
                      ) {
                        navigator.clipboard.writeText(deviceCode.userCode);
                      }
                    });
                }}
              >
                Copy to clipboard
              </div>
            </div>
          ) : (
            <>Loading</>
          )}
        </>
      )}
    </div>
  );
};
