import type { MediaTrackerRouter } from '@server/routes';
import { createTRPCReact } from '@trpc/react-query';

import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';

export const trpc = createTRPCReact<MediaTrackerRouter>({});

export type RouterInput = inferRouterInputs<MediaTrackerRouter>;
export type RouterOutput = inferRouterOutputs<MediaTrackerRouter>;
