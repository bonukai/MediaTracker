import React, { FunctionComponent, useEffect, useState } from 'react';
import { Trans } from '@lingui/macro';

import { setLastSeenEpisode, useDetails } from 'src/api/details';
import { Modal } from 'src/components/Modal';
import { SelectSeenDateComponent } from 'src/components/SelectSeenDate';
import { MediaItemItemsResponse, TvSeason } from 'mediatracker-api';
import { formatSeasonNumber } from 'src/utils';

export const SelectLastSeenEpisode: FunctionComponent<{
  tvShow: MediaItemItemsResponse;
  season?: TvSeason;
  closeModal: (selected?: boolean) => void;
}> = (props) => {
  const { closeModal, season } = props;

  const { mediaItem: tvShow, isLoading } = useDetails(props.tvShow.id);

  const [selectedSeasonId, setSelectedSeasonId] = useState<number>(season?.id);

  const selectedSeason = tvShow?.seasons?.find(
    (value) => value.id === selectedSeasonId
  );

  const [selectedEpisodeId, setSelectedEpisodeId] = useState<number>(
    selectedSeason?.episodes[selectedSeason?.episodes.length - 1].id
  );

  const selectedEpisode = selectedSeason?.episodes?.find(
    (episode) => episode.id === selectedEpisodeId
  );

  useEffect(() => {
    if (season || !tvShow || tvShow?.seasons?.length === 0) {
      return;
    }

    const seasonsWithEpisodes = tvShow.seasons.filter(
      (season) => season.episodes.length > 0
    );

    const firstSeason = seasonsWithEpisodes[seasonsWithEpisodes.length - 1];

    setSelectedSeasonId(firstSeason.id);
    setSelectedEpisodeId(
      firstSeason.episodes[firstSeason.episodes.length - 1].id
    );
  }, [tvShow, season]);

  useEffect(() => {
    if (selectedSeason && !selectedEpisode) {
      setSelectedEpisodeId(selectedSeason.episodes?.at(0)?.id);
    }
  }, [selectedSeason, selectedEpisode]);

  return (
    <div className="p-3 rounded ">
      {isLoading ? (
        <Trans>Loading</Trans>
      ) : (
        <>
          <div className="max-w-sm py-2 mx-5 text-2xl font-bold text-center">
            <Trans>
              What is the last episode of &quot;
              {season
                ? `${tvShow.title} ${formatSeasonNumber(season)}`
                : tvShow.title}
              &quot; you see?
            </Trans>
          </div>
          <div className="text-lg">
            {!season && (
              <div className="py-2">
                <span className="mr-2">
                  <Trans>Season</Trans>:
                </span>
                <select
                  value={selectedSeasonId}
                  onChange={(e) => setSelectedSeasonId(Number(e.target.value))}
                >
                  {tvShow.seasons
                    ?.filter((season) => !season.isSpecialSeason)
                    .map((season) => (
                      <option key={season.id} value={season.id}>
                        {season.title}
                      </option>
                    ))}
                </select>
              </div>
            )}
            <div className="py-2">
              <span className="mr-2">
                <Trans>Episode</Trans>:
              </span>
              <select
                value={selectedEpisodeId}
                onChange={(e) => setSelectedEpisodeId(Number(e.target.value))}
              >
                {selectedSeason?.episodes?.map((episode) => (
                  <option key={episode.id} value={episode.id}>
                    {!episode.title.endsWith(` ${episode.episodeNumber}`) &&
                      episode.episodeNumber + '. '}

                    {episode.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-between mt-2">
            <Modal
              closeOnBackgroundClick={true}
              closeOnEscape={true}
              onBeforeClosed={() => closeModal(true)}
              openModal={(onClick) => (
                <div className="btn-blue" onClick={onClick}>
                  <Trans>Select</Trans>
                </div>
              )}
            >
              {(closeModal) => (
                <SelectSeenDateComponent
                  mediaItem={tvShow}
                  closeModal={closeModal}
                  onSelected={async (args) => {
                    closeModal();

                    await setLastSeenEpisode({
                      mediaItem: tvShow,
                      lastSeenAt: args.seenAt,
                      date: args.date,
                      episode: selectedEpisode,
                      season: season ? selectedSeason : undefined,
                    });
                  }}
                />
              )}
            </Modal>

            <div className="btn-red" onClick={() => closeModal()}>
              <Trans>Cancel</Trans>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
