import { FC, PropsWithChildren, useState } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/react-query';

import { trpc } from './trpc';

export const TrpcProvider: FC<PropsWithChildren> = (props) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        // defaultOptions: {
        //   queries: {
        //     // retry: false,
        //     useErrorBoundary: false
        //   },
        //   // queries: {
        //   //   retry(_, error) {
        //   //     console.log(_, error);
        //   //     if (error instanceof TRPCClientError) {
        //   //       return false;
        //   //     }
        //   //     return true;
        //   //   },
        //   // },
        // },
      })
  );
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: '/api/trpc',
        }),
      ],
    })
  );

  // console.log(queryClient.get())

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {props.children}
      </QueryClientProvider>
    </trpc.Provider>
  );
};
