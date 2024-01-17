import { FC } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { TrpcProvider } from './utils/trpcProvider';

import { i18n } from '@lingui/core';
import { I18nProvider } from '@lingui/react';
import { UndoProvider } from './hooks/useUndoPopup';
import { MediaItemDisplayFormatContextProvider } from './hooks/useMediaItemDisplayFormat';
import { setupI18n2 } from './i18n.js';

setupI18n2();

export const App: FC = () => {
  return (
    <I18nProvider i18n={i18n}>
      <TrpcProvider>
        <UndoProvider>
          <MediaItemDisplayFormatContextProvider>
            <RouterProvider router={router} />
          </MediaItemDisplayFormatContextProvider>
        </UndoProvider>
      </TrpcProvider>
    </I18nProvider>
  );
};
