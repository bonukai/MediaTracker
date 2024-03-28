import { useMutation } from '@tanstack/react-query';
import { RouterInput, trpc } from '../utils/trpc';

export const useApiTokenUrlMutation = <Type extends keyof typeof transformers>(
  args:
    | {
        name: string;
        type?: void;
      }
    | { name?: void; type: Type }
) => {
  type ParamsType = (typeof transformers)[Type]['params'];
  type TransformerType = (typeof transformers)[Type];

  const { name, type } = args;
  const utils = trpc.useUtils();
  const configuration = trpc.configuration.getPublic.useQuery();
  const tokenMutation = trpc.applicationToken.create.useMutation({
    onSuccess: () => {
      utils.applicationToken.getAll.invalidate();
    },
    cacheTime: Infinity,
  });

  const url = new URL(configuration.data?.publicAddress || location.origin);

  const getToken = async (args: TransformerType, params: ParamsType) => {
    const { name, scope, transformer } = args;

    const token = await tokenMutation.mutateAsync({
      createdBy: 'user',
      name,
      scope,
    });

    const res = transformer ? transformer({ token, url }) : token;

    if (res instanceof URL) {
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value) {
            res.searchParams.append(key, value.toString());
          }
        });
      }

      return res.href;
    }

    return res;
  };

  const mutation = useMutation(
    async (args: ParamsType) => {
      if (type) {
        return getToken(transformers[type], args);
      }

      if (!name) {
        throw new Error(`name or type is required`);
      }

      return await tokenMutation.mutateAsync({
        createdBy: 'user',
        name,
      });
    },
    {
      cacheTime: Infinity,
    }
  );

  return mutation;
};

type TokenTransformer<
  T extends Record<string, string | number | undefined> | void = void,
> = {
  name: string;
  scope: RouterInput['applicationToken']['create']['scope'];
  params?: T;
  transformer?: (args: { token: string; url: URL }) => URL | string;
};

const tokenTransformer = <
  T extends Record<string, string | number | undefined> | void = void,
>(
  args: TokenTransformer<T>
): TokenTransformer<T> => args;

const transformers = {
  'calendar-iCal-webcal': tokenTransformer({
    name: 'iCal Calendar',
    scope: 'calendar',
    transformer: ({ token, url }) =>
      `webcal://${url.host}/api/v1/calendar/i-cal?token=${token}`,
  }),
  plex: tokenTransformer<{ plexUserId?: number; plexUserName?: string }>({
    name: 'plex',
    scope: 'integration',
    transformer: ({ token, url }) =>
      new URL(`/api/v1/plex?token=${token}`, url.origin),
  }),
  'calendar-iCal-download-link': tokenTransformer({
    name: 'iCal Calendar',
    scope: 'calendar',
    transformer: ({ token, url }) =>
      new URL(`/api/v1/calendar/i-cal?token=${token}`, url.origin),
  }),
  'calendar-rss': tokenTransformer({
    name: 'RSS Calendar',
    scope: 'calendar',
    transformer: ({ token, url }) =>
      new URL(`/api/v1/calendar/rss?token=${token}`, url.origin),
  }),
  'calendar-json': tokenTransformer({
    name: 'JSON Calendar',
    scope: 'calendar',
    transformer: ({ token, url }) =>
      new URL(`/api/v1/calendar/json?token=${token}`, url.origin),
  }),
  'list-items-json': tokenTransformer<RouterInput['list']['getListItems']>({
    name: 'JSON list items',
    scope: 'listItems',
    transformer: ({ token, url }) =>
      new URL(`/api/v1/list/get-list-items?token=${token}`, url.origin),
  }),
  'list-items-rss': tokenTransformer<RouterInput['list']['getListItemsRss']>({
    name: 'RSS list items',
    scope: 'listItems',
    transformer: ({ token, url }) =>
      new URL(`/api/v1/list/get-list-items-rss?token=${token}`, url.origin),
  }),
  kodi: tokenTransformer({
    name: 'Kodi',
    scope: 'integration',
  }),
  jellyfin: tokenTransformer({
    name: 'Jellyfin',
    scope: 'integration',
  }),
};
