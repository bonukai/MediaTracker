import React, { FunctionComponent } from 'react';
import { QueryCache, QueryClient, QueryClientProvider } from 'react-query';
import { HashRouter as Router } from 'react-router-dom';
import { FetchError } from 'src/api/api';
import { DarkModeProvider } from 'src/hooks/darkMode';

import { MyRouter } from './Router';
import { i18n } from '@lingui/core';
import { I18nProvider } from '@lingui/react';
import { Trans } from '@lingui/macro';
import { setupI18n } from 'src/i18n/i18n';

import './styles/fullcalendar.css';
import './styles/main.scss';
import './styles/tailwind.css';

setupI18n();

export const queryClient = new QueryClient({
  defaultOptions: {
    mutations: {
      mutationFn: (a) => {
        console.log(a);
        return null;
      },
    },
    queries: {
      queryFn: (x) => {
        console.log(x);
        return null;
      },
      keepPreviousData: true,
      onSuccess: (data) => {
        if (
          data &&
          typeof data === 'object' &&
          data['MediaTrackerError'] === true &&
          typeof data['errorMessage'] === 'string'
        ) {
          throw new Error(data['errorMessage']);
        }
      },
    },
  },
  queryCache: new QueryCache({
    onError: (error) => {
      if (error instanceof FetchError) {
        console.log(error.status);
        globalSetErrorMessage(error.message);
      }
    },
    onSuccess: () => {
      globalSetErrorMessage(null);
    },
  }),
});

let globalSetErrorMessage: (message: string) => void;

export const App: FunctionComponent = () => {
  const [errorMessage, setErrorMessage] = React.useState<string>();

  React.useEffect(() => {
    globalSetErrorMessage = setErrorMessage;
    return () => {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      globalSetErrorMessage = () => {};
    };
  }, []);

  return (
    <I18nProvider i18n={i18n}>
      <DarkModeProvider>
        <QueryClientProvider client={queryClient}>
          <Router>
            <MyRouter />
          </Router>
        </QueryClientProvider>
        {errorMessage && (
          <div className="fixed z-50 p-1 m-auto -translate-x-1/2 bg-red-700 rounded shadow-sm cursor-default shadow-black left-1/2 top-4">
            <Trans>Server error: {errorMessage}</Trans>
          </div>
        )}
      </DarkModeProvider>
    </I18nProvider>
  );
};
