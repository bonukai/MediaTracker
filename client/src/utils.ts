import type { ListSortBy } from '@server/entity/listModel';
import type {
  EpisodeResponse,
  MediaItemResponse,
  MediaType,
  SeasonResponse,
} from '@server/entity/mediaItemModel';

export const cx = (
  ...classNames: Array<
    | string
    | null
    | undefined
    | number
    | boolean
    | Record<string | number, string | undefined | number | boolean | null>
  >
): string => {
  return classNames
    .filter((item) => !!item)
    .map((item) =>
      item !== null && typeof item === 'object'
        ? Object.entries(item)
            .filter(([_, value]) => !!value)
            .map(([key]) => key)
            .join(' ')
            .trim()
        : item
    )
    .join(' ')
    .trim();
};

export const randomId = (): string => {
  return Array.from(window.crypto.getRandomValues(new Uint32Array(4)))
    .map((item) => item.toString())
    .join('');
};

export const getListItemKey = (listItem: {
  mediaItem: MediaItemResponse;
  season?: SeasonResponse | null;
  episode?: EpisodeResponse | null;
}): string => {
  return [
    listItem.mediaItem.id,
    listItem.season?.id,
    listItem.episode?.id,
  ].toString();
};

export const minBy = <T, U extends number | string | null | undefined>(
  data: T[],
  fn: (item: T) => U
) => {
  const min = data.reduce<{ index?: number; min?: U }>(
    (previous, current, index) => {
      const min = fn(current);

      return previous.min && min && previous.min < min
        ? previous
        : { index, min };
    },
    { index: undefined, min: undefined }
  );

  if (min.index !== undefined) {
    return data[min.index];
  }
};

export const openUrl = (url: string) => {
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  document.body.appendChild(a);
  a.click();
  a.remove();
};

export const downloadFile = (args: { blob: Blob; filename: string }) => {
  const url = window.URL.createObjectURL(args.blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = args.filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
};

export const listSortByElements: ListSortBy[] = [
  'last-airing',
  'last-seen',
  'listed',
  'media-type',
  'next-airing',
  'progress',
  'recently-added',
  'recently-aired',
  'recently-watched',
  'release-date',
  'runtime',
  'status',
  'title',
  'unseen-episodes-count',
  'user-rating',
];

export const mediaTypesElements: MediaType[] = [
  'tv',
  'movie',
  'video_game',
  'book',
  'audiobook',
];

export const booleanToYesNoAll = (value?: boolean) => {
  if (value === true) {
    return 'yes';
  } else if (value === false) {
    return 'no';
  }
  return 'all';
};

export const stringToYesNoUndefined = (value?: string) => {
  if (value === 'yes') {
    return true;
  } else if (value === 'no') {
    return false;
  }
  return undefined;
};

export const canCopyToClipboard = () => {
  return navigator.clipboard !== null && navigator.clipboard !== undefined;
};

export const copyTextToClipboard = (value: string) => {
  navigator.clipboard.writeText(value);
};
