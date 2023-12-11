import React from 'react';
import { t } from '@lingui/macro';

import { MediaType } from 'mediatracker-api';
import { isAudiobook, isBook, isMusic, isVideoGame, reverseMap } from 'src/utils';
import { useMenuComponent } from 'src/hooks/menu';

const useFilterTextMap = (mediaType: MediaType) => {
  return {
    all: t`All`,
    onlyWithUserRating: t`Rated`,
    onlyWithoutUserRating: t`Unrated`,
    onlyOnWatchlist: t`On watchlist`,
    onlySeenItems: isAudiobook(mediaType) || isMusic(mediaType)
      ? t`Listened`
      : isBook(mediaType)
      ? t`Read`
      : isVideoGame(mediaType)
      ? t`Played`
      : t`Watched`,
  };
};

export const useFilterBy = (mediaType: MediaType) => {
  const filterTextMap = useFilterTextMap(mediaType);
  const filterTextReverseMap = reverseMap(filterTextMap);

  const { selectedValue, Menu } = useMenuComponent({
    values: Object.values(filterTextMap),
    initialSelection: filterTextMap['all'],
  });

  return {
    filter: {
      [filterTextReverseMap[selectedValue]]: true,
    },
    FilterByComponent: () => {
      return (
        <Menu>
          <div className="flex ml-2 cursor-pointer select-none">
            <span className="material-icons">filter_alt</span>&nbsp;
            {selectedValue}
          </div>
        </Menu>
      );
    },
  };
};
