import { addMonths, subMonths } from 'date-fns';
import { FC, ReactNode, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { Trans } from '@lingui/macro';
import type {
  EpisodeResponse,
  MediaItemResponse,
} from '@server/entity/mediaItemModel';

import { Button } from '../components/Button';
import { Calendar } from '../components/Calendar';
import { dialogActionFactory } from '../components/Dialog';
import { CopyIcon, DownloadIcon, RssIcon } from '../components/Icons';
import { MainTitle } from '../components/MainTitle';
import { MediaTypeTranslation } from '../components/Translations';
import { useApiTokenUrlMutation } from '../hooks/useApiTokenUrl';
import { formatEpisodeNumber, posterSrc } from '../mediaItemHelpers';
import {
  canCopyToClipboard,
  copyTextToClipboard,
  downloadFile,
  openUrl,
} from '../utils';
import { trpc } from '../utils/trpc';
import { EmbeddedSingleLineCodeWithCopyButton } from '../components/EmbeddedSingleLineCodeWithCopyButton';
import { Poster } from '../components/Poster';

const CopyApiUrlAction = dialogActionFactory<{
  tokenMutationArgs: Parameters<typeof useApiTokenUrlMutation>['0'];
  dialogTitle: ReactNode;
}>((props) => {
  const { closeDialog, tokenMutationArgs: tokenType, dialogTitle } = props;

  const tokenMutation = useApiTokenUrlMutation(tokenType);

  useEffect(() => {
    if (!tokenMutation.isLoading) {
      tokenMutation.mutate();
    }
  }, []);

  return (
    <>
      <div className="mb-8 text-xl font-semibold">{dialogTitle}</div>
      <div>
        {tokenMutation.data && (
          <EmbeddedSingleLineCodeWithCopyButton code={tokenMutation.data} />
        )}
      </div>
      <div className="flex justify-end mt-4">
        <Button
          type="secondary"
          color="red"
          preventDefault
          onClick={closeDialog}
        >
          <Trans>Close</Trans>
        </Button>
      </div>
    </>
  );
});

const RssIconButton: FC = () => {
  return (
    <CopyApiUrlAction
      dialogTitle={<Trans>RSS feed</Trans>}
      tokenMutationArgs={{ type: 'calendar-rss' }}
    >
      <Button icon={<RssIcon />} text={<Trans>RSS feed</Trans>} />
    </CopyApiUrlAction>
  );
};

const JsonIconButton: FC = () => {
  return (
    <CopyApiUrlAction
      dialogTitle={<Trans>JSON url</Trans>}
      tokenMutationArgs={{ type: 'calendar-json' }}
    >
      <Button text={<Trans>JSON url</Trans>} />
    </CopyApiUrlAction>
  );
};

export const CalendarPage: FC = () => {
  const [currentDate, setCurrentDate] = useState<{ from: Date; to: Date }>();

  const calendarItems = trpc.calendar.json.useQuery(
    currentDate
      ? {
          from: subMonths(currentDate.from, 2).toISOString(),
          to: addMonths(currentDate?.to, 2).toISOString(),
        }
      : { from: '', to: '' },
    {
      enabled: currentDate !== undefined,
    }
  );
  return (
    <div className="max-w-6xl">
      <MainTitle>
        <Trans>Calendar</Trans>
      </MainTitle>

      <div className="flex justify-end gap-2 mb-4">
        <ICalPopup>
          <Button text={<Trans>iCal</Trans>} />
        </ICalPopup>

        <RssIconButton />
        <JsonIconButton />
      </div>

      <Calendar
        onDateChange={(from, to) => setCurrentDate({ from, to })}
        items={calendarItems?.data?.map((item) => ({
          date: new Date(item.releaseDate),
          item: item,
          key: [
            item.mediaItem.id,
            item.releaseType,
            item.episode?.id,
          ].toString(),
        }))}
        itemComponent={CalendarItem}
      />
    </div>
  );
};

const CalendarItem: FC<{
  mediaItem: MediaItemResponse;
  episode?: EpisodeResponse;
}> = ({ mediaItem, episode }) => {
  return (
    <div className="flex w-full p-1 mb-2 text-white bg-[#2a1c35] rounded-lg">
      <div className="items-center justify-center hidden w-5 mr-1 lg:flex ">
        <Poster mediaItem={mediaItem} width={100} />
      </div>

      <div className="flex flex-col justify-center w-full overflow-x-clip">
        <div className="text-stone-50 text-[12px] font-bold leading-none tracking-wide  inline-block w-full text-ellipsis whitespace-nowrap overflow-clip">
          <Link to={`/details/${mediaItem.id}`}>{mediaItem.title}</Link>
        </div>

        <div className="mt-0.5 text-stone-300 text-[12px] font-medium leading-none tracking-wide flex items-center">
          <MediaTypeTranslation mediaType={mediaItem.mediaType} />
          {episode && (
            <>
              <div className="inline mx-1.5">•</div>
              {formatEpisodeNumber(episode)}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const ICalPopup = dialogActionFactory((props) => {
  const { closeDialog } = props;
  const iCalWebLinkMutation = useApiTokenUrlMutation({
    type: 'calendar-iCal-webcal',
  });
  const iCalDownloadMutation = useApiTokenUrlMutation({
    type: 'calendar-iCal-download-link',
  });

  return (
    <div className="flex flex-col gap-3">
      <Button
        text={<Trans>Open iCal link with web browser</Trans>}
        onClick={async () => {
          openUrl(await iCalWebLinkMutation.mutateAsync());
          closeDialog();
        }}
      />

      <Button
        icon={<DownloadIcon />}
        text={<Trans>Download iCal file</Trans>}
        onClick={async () => {
          downloadFile({
            blob: new Blob([await iCalDownloadMutation.mutateAsync()]),
            filename: 'MediaTracker.ics',
          });
          closeDialog();
        }}
      />

      {canCopyToClipboard() && (
        <Button
          icon={<CopyIcon />}
          text={<Trans>Copy iCal url</Trans>}
          onClick={async () => {
            copyTextToClipboard(await iCalDownloadMutation.mutateAsync());
            closeDialog();
          }}
        />
      )}

      <div className="flex justify-end mt-4">
        <Button
          type="secondary"
          color="red"
          text={<Trans>Cancel</Trans>}
          onClick={closeDialog}
        />
      </div>
    </div>
  );
});
