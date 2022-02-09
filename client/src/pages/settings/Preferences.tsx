import React, { FunctionComponent } from 'react';
import { t } from '@lingui/macro';
import { useUser } from 'src/api/user';
import { CheckboxWithTitleAndDescription } from 'src/components/Checkbox';

export const SettingsPreferencesPage: FunctionComponent = () => {
  const { user, updateUser } = useUser();

  return (
    <>
      <CheckboxWithTitleAndDescription
        title={t`Public reviews`}
        description={t`Show your reviews to other users`}
        checked={user.publicReviews}
        onChange={(value) => updateUser({ publicReviews: value })}
      />

      <CheckboxWithTitleAndDescription
        title={t`Avoid episode spoilers`}
        description={t`Hide title of unseen episodes`}
        checked={user.hideEpisodeTitleForUnseenEpisodes}
        onChange={(value) =>
          updateUser({
            hideEpisodeTitleForUnseenEpisodes: value,
          })
        }
      />

      <CheckboxWithTitleAndDescription
        title={t`Avoid season spoilers`}
        description={t`Hide overview of unseen seasons`}
        checked={user.hideOverviewForUnseenSeasons}
        onChange={(value) =>
          updateUser({
            hideOverviewForUnseenSeasons: value,
          })
        }
      />
    </>
  );
};
