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
        description={t`Hide episode title of unseen episodes`}
        checked={user.clientPreferences?.hideEpisodeTitleForUnseenEpisodes}
        onChange={(value) =>
          updateUser({
            clientPreferences: {
              hideEpisodeTitleForUnseenEpisodes: value,
            },
          })
        }
      />

      <CheckboxWithTitleAndDescription
        title={t`Avoid season spoilers`}
        description={t`Hide seasons overview of unseen seasons`}
        checked={user.clientPreferences?.hideOverviewForUnseenSeasons}
        onChange={(value) =>
          updateUser({
            clientPreferences: {
              hideOverviewForUnseenSeasons: value,
            },
          })
        }
      />
    </>
  );
};
