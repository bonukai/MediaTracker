import { format } from 'date-fns';

type iCalEventType = {
  uid: string;
  summary: string;
  start: Date;
  allDay: boolean;
};

const iCalEntry = (
  name: string,
  value?: string | number | null | Date,
  valueType?: 'DATE' | 'DATE-TIME'
) => {
  if (value === undefined || value === null) {
    return;
  }

  if (typeof value === 'object' && valueType === 'DATE') {
    return `${name};VALUE=DATE:${format(value, 'yyyyMMdd')}`;
  }

  if (typeof value === 'object') {
    return `${name}:${format(value, `yyyyMMdd'T'hhmmss'Z'`)}`;
  }

  return `${name}:${value}`;
};

export const iCalBuilder = (args: {
  name: string;
  description?: string;
  events: iCalEventType[];
}) => {
  const { name, description, events } = args;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'CALSCALE:GREGORIAN',
    'PRODID:-//bonukai//MediaTracker',
    iCalEntry('NAME', name),
    iCalEntry('X-WR-CALNAME', name),
    iCalEntry('DESCRIPTION', description),
    iCalEntry('X-WR-CALDESC', description),
    iCalEntry('TIMEZONE-ID', timezone),
    iCalEntry('X-WR-TIMEZONE', timezone),
    'METHOD:PUBLISH',
    ...events.flatMap((event) => [
      'BEGIN:VEVENT',
      iCalEntry('UID', event.uid),
      iCalEntry('DTSTAMP', new Date()),
      iCalEntry('SUMMARY', event.summary),
      iCalEntry('DTSTART', event.start, event.allDay ? 'DATE' : undefined),
      'END:VEVENT',
    ]),
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n');
};
