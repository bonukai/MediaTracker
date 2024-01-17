import { FC, ReactNode } from 'react';
import { Trans } from '@lingui/macro';
import {
  useMediaItemDisplayFormat,
  MediaItemDisplayFormat,
} from '../hooks/useMediaItemDisplayFormat';
import {
  ViewCardIcon,
  ViewGrid2Icon,
  ViewGridIcon,
  ViewListIcon,
} from './Icons';

export const SetItemDisplayType: FC = () => {
  const place = location.pathname.split('/').at(1) || '';
  const { setDisplayFormat, canUseListView } = useMediaItemDisplayFormat();
  const displayFormats: Record<
    MediaItemDisplayFormat,
    { text: ReactNode; icon: ReactNode }
  > = {
    card: {
      text: <Trans>Card</Trans>,
      icon: <ViewCardIcon />,
    },
    'poster-minimal': {
      text: <Trans>Poster minimal</Trans>,
      icon: <ViewGrid2Icon />,
    },
    poster: {
      text: <Trans>Poster</Trans>,
      icon: <ViewGridIcon />,
    },
    list: {
      text: <Trans>List</Trans>,
      icon: <ViewListIcon />,
    },
  };

  return (
    <div className="flex gap-2 mb-4">
      {Object.entries(displayFormats)
        .filter(([key]) => (key === 'list' ? canUseListView : true))
        .map(([key, { text, icon }]) => (
          <span
            key={key}
            className="px-1 py-0.5 rounded bg-amber-300 hover:cursor-pointer flex whitespace-nowrap h-min"
            onClick={() =>
              setDisplayFormat(place, key as MediaItemDisplayFormat)
            }
          >
            {icon} {text}
          </span>
        ))}
    </div>
  );
};
