import { FC, ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { Trans } from '@lingui/macro';

import { ItemsParentContainer } from '../components/ItemsParentContainer';
import { MainTitle } from '../components/MainTitle';
import { SetItemDisplayType } from '../components/SetItemDisplayType';
import { trpc } from '../utils/trpc';
import { MediaItemPresentationSettings } from '../components/MediaItemViews';
import { TranslatedHomeScreenBuiltinSectionName } from './settings/HomePageSettingsPage';

import type { HomeSectionConfig } from '@server/entity/homeSectionModel';
import type {
  EpisodeResponse,
  MediaItemResponse,
  SeasonResponse,
} from '@server/entity/mediaItemModel';

const NoItemsInstructions: FC = () => {
  return (
    <>
      <Trans>
        Add{' '}
        <Link to="/search/tv" className="link">
          TV
        </Link>
        ,{' '}
        <Link to="/search/movie" className="link">
          movies
        </Link>
        ,{' '}
        <Link to="/search/video_game" className="link">
          video games
        </Link>
        ,{' '}
        <Link to="/search/book" className="link">
          books
        </Link>{' '}
        or{' '}
        <Link to="/search/audiobook" className="link">
          audiobooks
        </Link>{' '}
        to your watchlist
      </Trans>

      <br />
      <br />
      <Trans>
        You can also configure your home screen{' '}
        <Link to="/settings/home-screen" className="link">
          here
        </Link>
      </Trans>
    </>
  );
};

const getDisplaySettingsForSection = (
  section: HomeSectionConfig
): MediaItemPresentationSettings => {
  if (section.type === 'list-view') {
    return {
      showNextAiring: true,
      showLastAiring: true,
      showAddFirstUnwatchedEpisodeToSeenHistoryButton: true,
      showRating: true,
      showNumberOfUnseenEpisodes: true,
    };
  } else {
    switch (section.name) {
      case 'builtin-section-upcoming':
        return {
          showNextAiring: true,
        };
      case 'builtin-section-recently-released':
        return {
          showAddToSeenHistoryButton: true,
          showAddFirstUnwatchedEpisodeToSeenHistoryButton: true,
          showLastAiring: true,
          showRating: true,
          showNumberOfUnseenEpisodes: true,
        };
      case 'builtin-section-next-episode-to-watch':
        return {
          showAddToSeenHistoryButton: true,
          showAddFirstUnwatchedEpisodeToSeenHistoryButton: true,
          showLastAiring: true,
          showRating: true,
          showNumberOfUnseenEpisodes: true,
        };
      case 'builtin-section-unrated':
        return {
          showRating: true,
        };
    }
  }
};

const HomeScreenSection: FC<{
  title: ReactNode;
  items: {
    mediaItem: MediaItemResponse;
    episode?: EpisodeResponse | null;
    season?: SeasonResponse | null;
  }[];
  settings?: MediaItemPresentationSettings;
}> = (props) => {
  const { items, title, settings } = props;

  return (
    <>
      <div className="mb-12">
        <MainTitle>{title}</MainTitle>
        <ItemsParentContainer items={items} settings={settings} />
      </div>
    </>
  );
};

export const HomePage: FC = () => {
  const homePageElementsQuery = trpc.homeSection.homePageItems.useQuery();

  return (
    <>
      <div className="">
        <SetItemDisplayType />

        {homePageElementsQuery.data?.map((item) => (
          <HomeScreenSection
            key={item.id}
            items={item.items}
            title={
              item.section.type === 'builtin' ? (
                <TranslatedHomeScreenBuiltinSectionName
                  name={item.section.name}
                />
              ) : (
                item.section.name
              )
            }
            settings={getDisplaySettingsForSection(item.section)}
          />
        ))}

        {homePageElementsQuery.data?.length === 0 && <NoItemsInstructions />}
      </div>
    </>
  );
};
