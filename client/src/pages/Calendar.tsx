import React, { FunctionComponent, useMemo, useState } from 'react';
import { useQuery } from 'react-query';
import FullCalendar, { DatesSetArg } from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import listPlugin from '@fullcalendar/list';
import allLocales from '@fullcalendar/core/locales-all';
import { useLingui } from '@lingui/react';
import { parseISO } from 'date-fns';

import { MediaType, TvEpisode } from 'mediatracker-api';
import { mediaTrackerApi } from 'src/api/api';
import { formatEpisodeNumber } from 'src/utils';
import { Trans } from '@lingui/macro';

export const CalendarPage: FunctionComponent = () => {
  const [datesSet, setDatesSet] = useState<DatesSetArg>();

  const { data, isLoading } = useQuery(
    ['calendar', datesSet?.startStr, datesSet?.endStr],
    () =>
      mediaTrackerApi.calendar.get({
        start: datesSet.startStr,
        end: datesSet.endStr,
      }),
    {
      keepPreviousData: true,
      enabled: datesSet !== undefined,
    }
  );

  const events = useMemo(
    () =>
      data?.map((item) => ({
        title: item.mediaItem.title,
        date: parseISO(item.releaseDate),
        allDay: true,
        ...(item.episode
          ? {
              backgroundColor: episodeColor(item.episode),
              borderColor: episodeColor(item.episode),
              url: `#/episode/${item.mediaItem.id}/${item.episode.seasonNumber}/${item.episode.episodeNumber}`,
              extendedProps: {
                seen: item.episode.seen,
                episodeNumber: formatEpisodeNumber(item.episode),
              },
            }
          : {
              backgroundColor: eventColor(item.mediaItem.mediaType),
              borderColor: eventColor(item.mediaItem.mediaType),
              url: `#/details/${item.mediaItem.id}`,
              extendedProps: {
                seen: item.mediaItem.seen,
              },
            }),
      })),
    [data]
  );

  const lingui = useLingui();

  if (isLoading) {
    return <Trans>Loading</Trans>;
  }

  return (
    <div className="p-2">
      <FullCalendar
        locales={allLocales}
        locale={lingui.i18n.locale}
        plugins={[dayGridPlugin, listPlugin]}
        headerToolbar={{
          left: 'title',
          center: '',
          right: 'today prev,next dayGridMonth,listMonth',
        }}
        views={{
          listMonth: {
            displayEventTime: false,
          },
          dayGridMonth: {},
        }}
        initialView="dayGridMonth"
        dayMaxEvents={true}
        height="auto"
        datesSet={setDatesSet}
        events={events}
        eventContent={(arg) => (
          <div className="flex">
            <span className="overflow-hidden text-ellipsis">
              {arg.event.title}
            </span>
            {arg.event.extendedProps.episodeNumber && (
              <span>&nbsp;{arg.event.extendedProps.episodeNumber}</span>
            )}
            {arg.event.extendedProps.seen && (
              <i className="pl-0.5 ml-auto flex material-icons">
                check_circle_outline
              </i>
            )}
          </div>
        )}
      />
    </div>
  );
};

const eventColor = (mediaType: MediaType) => {
  switch (mediaType) {
    case 'book':
      return 'red';
    case 'tv':
      return 'blue';
    case 'movie':
      return 'orange';
    case 'video_game':
      return 'violet';
  }
};

const episodeColor = (episode: TvEpisode) => {
  return episode.episodeNumber === 1
    ? episode.seasonNumber === 1
      ? tvShowPremiereColor
      : seasonPremiereColor
    : null;
};

const seasonPremiereColor = 'orange';
const tvShowPremiereColor = 'green';
