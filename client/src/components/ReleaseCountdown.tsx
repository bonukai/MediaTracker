import { Plural } from '@lingui/macro';
import {
  differenceInCalendarDays,
  intervalToDuration,
  secondsToMilliseconds,
  subDays,
  subHours,
  subMinutes,
} from 'date-fns';
import { FC, useState, useEffect, ReactNode } from 'react';

const getDuration = (start: Date) => {
  const end = new Date();
  const duration = intervalToDuration({
    start: start,
    end: end,
  });

  const days = duration.days || 0;
  const hours = duration.hours || 0;
  const minutes = duration.minutes || 0;

  const extraDays = differenceInCalendarDays(
    start,
    subDays(subHours(subMinutes(end, minutes), hours), days)
  );

  return {
    minutes,
    hours,
    days: days + extraDays,
  };
};

export const ReleaseCountdown: FC<{ releaseDate: Date }> = (props) => {
  const { releaseDate } = props;
  const [duration, setDuration] = useState<{
    days: number;
    hours: number;
    minutes: number;
  }>(getDuration(releaseDate));

  useEffect(() => {
    const refreshCountDownInterval = setInterval(
      () => setDuration(getDuration(releaseDate)),
      secondsToMilliseconds(60)
    );

    return () => {
      clearInterval(refreshCountDownInterval);
    };
  });

  const { days, hours, minutes } = duration;

  const Box: FC<{ number: number; text: ReactNode }> = (props) => {
    const { number, text } = props;
    return (
      <div className="border-[1px] rounded px-2 py-1 justify-center items-center align-bottom flex flex-col">
        <div className="text-stone-950 font-semibold">{number}</div>
        <div className="text-[12px] text-stone-500">{text}</div>
      </div>
    );
  };

  return (
    <div className="flex gap-1">
      <Box
        number={days}
        text={<Plural value={days} one="day" other="days" />}
      />
      <Box
        number={hours}
        text={<Plural value={hours} one="hour" other="hours" />}
      />
      <Box
        number={minutes}
        text={<Plural value={minutes} one="minute" other="minutes" />}
      />
    </div>
  );
};
