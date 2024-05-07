import { FC } from 'react';

import { Trans } from '@lingui/macro';

import { Button } from '../../components/Button';
import { Form } from '../../components/Form';
import { MainTitle } from '../../components/MainTitle';
import { MediaTypeTranslation } from '../../components/Translations';
import { useUser } from '../../hooks/useUser';

import type { UserPreferences } from '@server/entity/userModel';
import type { MediaType } from '@server/entity/mediaItemModel';

type StartsWith<
  Prefix extends string,
  Value extends string,
> = Value extends `${Prefix}${infer _U}` ? Value : never;

const categoryToMediaTypeMap: Record<
  StartsWith<'showCategory', keyof UserPreferences>,
  MediaType
> = {
  showCategoryTv: 'tv',
  showCategoryMovie: 'movie',
  showCategoryVideoGame: 'video_game',
  showCategoryBook: 'book',
  showCategoryAudiobook: 'audiobook',
};

const categoryAndMediaTypeList = (
  Object.entries(categoryToMediaTypeMap) as [
    keyof typeof categoryToMediaTypeMap,
    (typeof categoryToMediaTypeMap)[keyof typeof categoryToMediaTypeMap],
  ][]
).map(([category, mediaType]) => ({
  category,
  mediaType,
}));

export const PreferencesSettingsPage: FC = () => {
  const { user, updatePreferences } = useUser();

  if (!user.data) {
    return <></>;
  }

  return (
    <>
      <MainTitle
        elements={[<Trans>Settings</Trans>, <Trans>Preferences</Trans>]}
      />

      <Form<Omit<UserPreferences, 'notificationPlatforms'>>
        initialValues={user.data.preferences}
        onSubmit={({ data }) => {
          updatePreferences.mutate(data);
        }}
        className=""
      >
        {({ SelectInput, MultiCheckboxInput, CheckboxInput }) => (
          <>
            <SelectInput
              inputName="language"
              title={<Trans>Language</Trans>}
              options={[
                { value: 'en', name: 'English' },
                { value: 'fr', name: 'Français' },
                { value: 'es', name: 'Español' },
                { value: 'da', name: 'Dansk' },
                { value: 'de', name: 'Deutsch' },
                { value: 'ko', name: '한국어' },
                { value: 'pt', name: 'Português' },
              ]}
            />

            <CheckboxInput
              inputName="sendNotificationForReleases"
              title={<Trans>Send notifications for releases</Trans>}
            />

            <SelectInput
              inputName="ratingSystem"
              title={<Trans>Rating system</Trans>}
              description={
                <Trans>
                  Internally, the rating is always stored in 10 starts system,
                  and changing this settings, doesn't affect your data
                </Trans>
              }
              options={[
                { value: '5-stars', name: <Trans>5 stars</Trans> },
                { value: '10-stars', name: <Trans>10 stars</Trans> },
              ]}
            />

            <MultiCheckboxInput
              title={<Trans>Enabled media types</Trans>}
              checkboxes={categoryAndMediaTypeList.map(
                ({ category, mediaType }) => ({
                  inputName: category,
                  name: <MediaTypeTranslation mediaType={mediaType} />,
                })
              )}
            />

            <MultiCheckboxInput
              title={<Trans>Spoilers</Trans>}
              checkboxes={[
                {
                  inputName: 'hideOverviewForUnseenSeasons',
                  name: <Trans>Hide overview of unseen seasons</Trans>,
                },
                {
                  inputName: 'hideEpisodeTitleForUnseenEpisodes',
                  name: <Trans>Hide title of unseen episodes</Trans>,
                },
              ]}
            />

            <div className="mt-2">
              <Button
                actionType="submit"
                isLoading={updatePreferences.isLoading}
              >
                <Trans>Save</Trans>
              </Button>
            </div>
          </>
        )}
      </Form>
    </>
  );
};
