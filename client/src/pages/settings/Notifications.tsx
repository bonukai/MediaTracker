import React, { FunctionComponent, useEffect, useRef } from 'react';
import { t, Trans } from '@lingui/macro';
import { User } from 'mediatracker-api';
import { useNotificationPlatformsCredentials } from 'src/api/notificationPlatformsCredentials';
import { useUser } from 'src/api/user';
import { CheckboxWithTitleAndDescription } from 'src/components/Checkbox';
import { SettingsSegment } from 'src/components/SettingsSegment';

export const SettingsNotificationsPage: FunctionComponent = () => {
  const { user, updateUser } = useUser();

  return (
    <>
      <CheckboxWithTitleAndDescription
        title={t`Send notification for releases`}
        description={t`Receive notification for all media items on your watchlist, when they are released, including new seasons for tv shows`}
        checked={user.sendNotificationForReleases}
        onChange={(value) => updateUser({ sendNotificationForReleases: value })}
      />
      <CheckboxWithTitleAndDescription
        title={t`Send notification for episodes releases`}
        description={t`Receive notification for every episode for all tv shows on your watchlist, when it's released`}
        checked={user.sendNotificationForEpisodesReleases}
        onChange={(value) =>
          updateUser({ sendNotificationForEpisodesReleases: value })
        }
      />
      <CheckboxWithTitleAndDescription
        title={t`Send notification when status changes`}
        description={t`Receive notification for all media items on your watchlist, when it's status changes`}
        checked={user.sendNotificationWhenStatusChanges}
        onChange={(value) =>
          updateUser({ sendNotificationWhenStatusChanges: value })
        }
      />
      <CheckboxWithTitleAndDescription
        title={t`Send notification when release date changes`}
        description={t`Receive notification for all media items on your watchlist, when it's release date changes`}
        checked={user.sendNotificationWhenReleaseDateChanges}
        onChange={(value) =>
          updateUser({ sendNotificationWhenReleaseDateChanges: value })
        }
      />
      <CheckboxWithTitleAndDescription
        title={t`Send notification when number of seasons changes`}
        description={t`Receive notification for all tv shows on your watchlist, when it's number of seasons changes`}
        checked={user.sendNotificationWhenNumberOfSeasonsChanges}
        onChange={(value) =>
          updateUser({ sendNotificationWhenNumberOfSeasonsChanges: value })
        }
      />
      <NotificationPlatform />

      <NotificationPlatformsCredentials
        platformName="Pushbullet"
        href="https://www.pushbullet.com"
      >
        <label>
          <Trans>App token</Trans>
          {/* https://www.pushbullet.com/#settings/account */}
          <input name="token" required className="block" />
        </label>
      </NotificationPlatformsCredentials>

      <NotificationPlatformsCredentials
        platformName="Pushover"
        href="https://pushover.net"
      >
        <label>
          {/* https://pushover.net */}
          <Trans> User key</Trans>
          <input name="key" required className="block" />
        </label>
      </NotificationPlatformsCredentials>

      <NotificationPlatformsCredentials
        platformName="Pushsafer"
        href="https://www.pushsafer.com"
      >
        <label>
          {/* https://www.pushsafer.com/dashboard */}
          <Trans>Key</Trans>
          <input name="key" required className="block" />
        </label>
      </NotificationPlatformsCredentials>

      <NotificationPlatformsCredentials
        platformName="gotify"
        href="https://gotify.net"
      >
        <label>
          <Trans>Gotify server url</Trans>
          <input name="url" type="url" required className="block" />
        </label>
        <label>
          <Trans>Access Token</Trans>
          <input name="token" required className="block" />
        </label>
        <label>
          <Trans>Priority</Trans>
          <select name="priority" className="block">
            <option></option>
            {new Array(10).fill(null).map((_, index) => (
              <option key={index}>{index + 1}</option>
            ))}
          </select>
        </label>
      </NotificationPlatformsCredentials>

      <NotificationPlatformsCredentials
        platformName="ntfy"
        href="https://ntfy.sh"
      >
        <label>
          <Trans>Topic</Trans>
          <input name="topic" required className="block" />
        </label>
        <label>
          <Trans>Priority</Trans>
          <select name="priority" className="block">
            <option></option>
            {new Array(5).fill(null).map((_, index) => (
              <option key={index}>{index + 1}</option>
            ))}
          </select>
        </label>
        <label>
          <Trans>Server url (only for self hosting)</Trans>
          <input name="url" type="url" className="block" />
        </label>
      </NotificationPlatformsCredentials>
    </>
  );
};

const platforms: ReadonlyArray<
  keyof User.GetNotificationCredentials.ResponseBody
> = ['gotify', 'Pushbullet', 'Pushover', 'Pushsafer'];

const NotificationPlatform: FunctionComponent = () => {
  const { user, updateUser } = useUser();

  return (
    <>
      <div className="flex mb-2">
        <select
          className="mr-1"
          value={user.notificationPlatform || ''}
          onChange={(e) => {
            updateUser({
              notificationPlatform: e.target.value as never,
            });
          }}
        >
          {platforms.map((platform) => (
            <option key={platform}>{platform}</option>
          ))}
        </select>
        <div>
          <Trans>Platform</Trans>
        </div>
      </div>
    </>
  );
};

const NotificationPlatformsCredentials: FunctionComponent<{
  platformName: string;
  href: string;
}> = (props) => {
  const { platformName, href } = props;
  const formRef = useRef<HTMLFormElement>();

  const {
    notificationPlatformsCredentials,
    setNotificationPlatformsCredentials,
  } = useNotificationPlatformsCredentials();

  useEffect(() => {
    if (
      notificationPlatformsCredentials &&
      platformName in notificationPlatformsCredentials
    ) {
      const credentials = notificationPlatformsCredentials[platformName];

      formRef.current
        .querySelectorAll<HTMLInputElement | HTMLSelectElement>('input,select')
        .forEach((input) => {
          if (input.name in credentials && !input.value) {
            input.value = credentials[input.name];
          }
        });
    }
  }, [platformName, notificationPlatformsCredentials]);

  return (
    <div className="mb-2">
      <SettingsSegment title={platformName} href={href}>
        <form
          ref={formRef}
          onSubmit={(e) => {
            e.preventDefault();

            const credentials = Object.fromEntries(
              new FormData(e.currentTarget).entries()
            );

            setNotificationPlatformsCredentials({
              platformName: platformName,
              credentials: credentials,
            } as User.UpdateNotificationCredentials.RequestBody);
          }}
        >
          {props.children}

          <button className="mt-2 btn">
            <Trans>Save</Trans>
          </button>
        </form>
      </SettingsSegment>
    </div>
  );
};
