import {
  FC,
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

const MIN_WIDTH_FOR_LIST_VIEW = 1800;

const MediaItemDisplayFormatContext = createContext<
  | {
      getDisplayFormat: () => MediaItemDisplayFormat;
      setDisplayFormat: (place: string, format: MediaItemDisplayFormat) => void;
      canUseListView: boolean;
    }
  | undefined
>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useMediaItemDisplayFormat = () => {
  const context = useContext(MediaItemDisplayFormatContext);

  if (!context) {
    throw new Error(`Missing provider for MediaItemDisplayFormatContext`);
  }

  return context;
};

export const MediaItemDisplayFormatContextProvider: FC<{
  children: ReactNode;
}> = (props) => {
  const { children } = props;

  const [data, setData] = useState<
    Partial<Record<string, MediaItemDisplayFormat>>
  >({});
  const [canUseListView, setCanUseListView] = useState<boolean>(
    window.innerWidth >= MIN_WIDTH_FOR_LIST_VIEW
  );

  const key = 'mediaItemDisplayFormats';

  useEffect(() => {
    const res = window.localStorage.getItem(key);

    if (res) {
      setData(JSON.parse(res));
    }

    const storageEventHandler = (ev: StorageEvent) => {
      if (ev.key === key) {
        if (ev.newValue) {
          setData(JSON.parse(ev.newValue));
        } else {
          setData({});
        }
      }
    };

    const resizeEventHandler = () => {
      setCanUseListView(window.innerWidth >= MIN_WIDTH_FOR_LIST_VIEW);
    };

    resizeEventHandler();

    addEventListener('resize', resizeEventHandler);
    addEventListener('storage', storageEventHandler);

    return () => {
      removeEventListener('storage', storageEventHandler);
      removeEventListener('resize', resizeEventHandler);
    };
  }, []);

  const setDisplayFormat = (place: string, format: MediaItemDisplayFormat) => {
    const newData = {
      ...data,
      [place]: format,
    };
    window.localStorage.setItem(key, JSON.stringify(newData));
    setData(newData);
  };

  const getDisplayFormat = (): MediaItemDisplayFormat => {
    const page = location.pathname.split('/').at(1) || '';
    const displayFormat = data[page] || 'poster';

    if (displayFormat === 'list' && !canUseListView) {
      return 'poster';
    }

    return displayFormat;
  };

  return (
    <MediaItemDisplayFormatContext.Provider
      value={{ setDisplayFormat, getDisplayFormat, canUseListView }}
    >
      {children}
    </MediaItemDisplayFormatContext.Provider>
  );
};

export type MediaItemDisplayFormat =
  | 'card'
  | 'poster'
  | 'poster-minimal'
  | 'list';
