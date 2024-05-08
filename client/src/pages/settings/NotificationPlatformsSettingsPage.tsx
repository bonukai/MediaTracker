import { FC, createElement, useState } from 'react';

import { Trans } from '@lingui/macro';

import { Accent } from '../../components/Accent';
import { Button } from '../../components/Button';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { dialogActionFactory } from '../../components/Dialog';
import { AddIcon, DeleteIcon } from '../../components/Icons';
import { MainTitle } from '../../components/MainTitle';
import {
  GotifyAddForm,
  GotifyDetails,
} from '../../components/releaseNotificationsComponents/gotify';
import {
  NtfyAddForm,
  NtfyDetails,
} from '../../components/releaseNotificationsComponents/ntfy';
import {
  ReleaseNotificationPlatformCredentials,
  ReleaseNotificationPlatformName,
} from '../../components/releaseNotificationsComponents/types';
import { useUser } from '../../hooks/useUser';
import {
  discordLogo,
  gotifyLogo,
  ntfyLogo,
  pushbulletLogo,
  pushoverLogo,
  pushsaferLogo,
} from '../../components/Logos';
import {
  DiscordAddForm,
  DiscordDetails,
} from '../../components/releaseNotificationsComponents/Discord';
import {
  PushbulletAddForm,
  PushbulletDetails,
} from '../../components/releaseNotificationsComponents/Pushbullet';
import {
  PushoverAddForm,
  PushoverDetails,
} from '../../components/releaseNotificationsComponents/Pushover';
import {
  PushsaferAddForm,
  PushsaferDetails,
} from '../../components/releaseNotificationsComponents/Pushsafer';

export const NotificationPlatformsSettingsPage: FC = () => {
  const { user } = useUser();

  if (!user.data) {
    return <></>;
  }

  const { notificationPlatforms } = user.data;

  const detailsComponents = {
    Discord: DiscordDetails,
    gotify: GotifyDetails,
    ntfy: NtfyDetails,
    Pushbullet: PushbulletDetails,
    Pushover: PushoverDetails,
    Pushsafer: PushsaferDetails,
  };

  return (
    <>
      <MainTitle
        elements={[
          <Trans>Settings</Trans>,
          <Trans>Notification platforms</Trans>,
        ]}
      />

      <div className="mb-6">
        <AddPlatformAction>
          <Button icon={<AddIcon />} text={<Trans>Add</Trans>} />
        </AddPlatformAction>
      </div>

      <div className="flex flex-col gap-4">
        {notificationPlatforms.map((platform) => (
          <div
            key={platform.id}
            className="flex justify-between p-4 border rounded border-stone-200 text-stone-800 w-fit"
          >
            <div className="flex gap-4">
              <div className="flex flex-col justify-center w-8 shrink-0">
                <PlatformLogo platform={platform.name} />
              </div>

              <div className="overflow-hidden w-96 whitespace-nowrap text-ellipsis">
                <div className="mb-2">{platform.name}</div>
                <div className="text-sm text-stone-600">
                  {/* {createElement(detailsComponents[platform.name], {
                    credentials: platform.credentials,
                  })} */}
                  {platform.name === 'ntfy' && (
                    <NtfyDetails credentials={platform.credentials} />
                  )}
                  {platform.name === 'gotify' && (
                    <GotifyDetails credentials={platform.credentials} />
                  )}
                  {platform.name === 'Discord' && (
                    <DiscordDetails credentials={platform.credentials} />
                  )}
                  {platform.name === 'Pushbullet' && (
                    <PushbulletDetails credentials={platform.credentials} />
                  )}
                  {platform.name === 'Pushover' && (
                    <PushoverDetails credentials={platform.credentials} />
                  )}
                  {platform.name === 'Pushsafer' && (
                    <PushsaferDetails credentials={platform.credentials} />
                  )}
                </div>
              </div>
            </div>

            <RemoveNotificationPlatformButton
              platformName={platform.name}
              id={platform.id}
            />
          </div>
        ))}
      </div>
    </>
  );
};

const RemoveNotificationPlatformButton: FC<{
  platformName: ReleaseNotificationPlatformName;
  id: string;
}> = (props) => {
  const { platformName, id } = props;
  const { removeReleaseNotificationPlatform } = useUser();

  return (
    <ConfirmDialog
      content={
        <Trans>
          Are you sure, you want to remove notification platform{' '}
          <Accent>{platformName}</Accent>?
        </Trans>
      }
      onConfirmed={() => removeReleaseNotificationPlatform.mutate({ id })}
    >
      <Button
        type="secondary"
        icon={<DeleteIcon />}
        text={<Trans>Remove</Trans>}
        color="red"
        isLoading={removeReleaseNotificationPlatform.isLoading}
      />
    </ConfirmDialog>
  );
};

const PlatformLogo: FC<{ platform: ReleaseNotificationPlatformName }> = (
  props
) => {
  const { platform } = props;

  const logo: Record<ReleaseNotificationPlatformName, string> = {
    ntfy: ntfyLogo,
    gotify: gotifyLogo,
    Discord: discordLogo,
    Pushbullet: pushbulletLogo,
    Pushover: pushoverLogo,
    Pushsafer: pushsaferLogo,
  };

  return <img src={logo[platform]} className="object-contain h-8 w-fit" />;
};

const AddPlatformAction = dialogActionFactory((props) => {
  const { closeDialog } = props;

  const [selectedPlatform, setSelectedPlatform] =
    useState<ReleaseNotificationPlatformName>('Discord');

  const addForms = {
    Discord: DiscordAddForm,
    gotify: GotifyAddForm,
    ntfy: NtfyAddForm,
    Pushbullet: PushbulletAddForm,
    Pushover: PushbulletAddForm,
    Pushsafer: PushsaferAddForm,
  };

  return (
    <>
      <div className="mb-6 text-lg font-semibold text-stone-800">
        <Trans>Add notification platform</Trans>
      </div>
      <div className="flex gap-2">
        <select
          className="mb-4"
          value={selectedPlatform}
          onChange={(e) =>
            setSelectedPlatform(
              e.currentTarget.value as ReleaseNotificationPlatformName
            )
          }
        >
          <option>Discord</option>
          <option>gotify</option>
          <option>ntfy</option>
          <option>Pushbullet</option>
          <option>Pushover</option>
          <option>Pushsafer</option>
        </select>

        {selectedPlatform && <PlatformLogo platform={selectedPlatform} />}
      </div>

      {createElement(addForms[selectedPlatform], { closeDialog })}
    </>
  );
});
