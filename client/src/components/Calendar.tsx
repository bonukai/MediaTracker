import { Plural } from '@lingui/macro';
import {
  addDays,
  addMonths,
  endOfMonth,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
  subDays,
  subMonths,
} from 'date-fns';
import { FC, useEffect, useState } from 'react';
import { cx } from '../utils';
import { CalendarTodayIcon, ChevronLeftIcon, ChevronRightIcon } from './Icons';
import {
  LocaleDayComponent,
  LocaleMonthYearComponent,
} from './LocaleDateParts';

export const Calendar = <T extends object>(props: {
  onDateChange?: (from: Date, to: Date) => void;
  items?: { date: Date; item: T; key: string }[];
  itemComponent?: FC<T>;
}) => {
  const { onDateChange, items, itemComponent: ItemComponent } = props;

  const [currentDate, setCurrentDate] = useState<Date>(
    startOfMonth(new Date())
  );

  useEffect(() => {
    if (onDateChange) {
      onDateChange(startOfMonth(currentDate), endOfMonth(currentDate));
    }
  }, []);

  const updateDate = (newDate: Date) => {
    setCurrentDate(newDate);

    if (onDateChange) {
      onDateChange(startOfMonth(newDate), endOfMonth(newDate));
    }
  };

  const firstDayInCalendarView = subDays(currentDate, currentDate.getDay() - 1);

  const itemByDay = items?.reduce(
    (res, current) =>
      res.set(startOfDay(current.date).toISOString(), [
        ...(res.get(startOfDay(current.date).toISOString()) || []),
        {
          item: current.item,
          key: current.key,
        },
      ]),
    new Map<string, { item: T; key: string }[]>()
  );

  return (
    <div className="select-none">
      <div className="grid w-full grid-cols-3 grid-rows-1 ">
        <div></div>
        <div className=" text-[20px] font-medium tracking-wide flex items-center justify-center">
          {<LocaleMonthYearComponent date={currentDate} />}
        </div>
        <div className="flex items-center justify-end gap-2">
          <div
            onClick={(e) => {
              e.preventDefault();
              updateDate(startOfMonth(new Date()));
            }}
            className="p-2 mr-2 border rounded-full border-zinc-600 hover:cursor-pointer"
          >
            <CalendarTodayIcon />
          </div>
          <div
            onClick={(e) => {
              e.preventDefault();
              updateDate(subMonths(currentDate, 1));
            }}
            className="p-2 border rounded-full border-zinc-600 hover:cursor-pointer"
          >
            <ChevronLeftIcon className="fill-current" />
          </div>
          <div
            onClick={(e) => {
              e.preventDefault();
              updateDate(addMonths(currentDate, 1));
            }}
            className="p-2 border rounded-full border-zinc-600 hover:cursor-pointer"
          >
            <ChevronRightIcon />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-7 my-5 rounded-md h-9 bg-zinc-200 border-zinc-300 border-[1px]">
        {new Array(7)
          .fill(null)
          .fill(null)
          .map((_value, index) => ({
            date: addDays(firstDayInCalendarView, index),
            isFirst: index === 0,
          }))
          .map(({ date, isFirst }) => (
            <div
              key={date.getTime()}
              className={cx(
                'flex justify-center items-center text-[14px] font-medium leading-tight',
                !isFirst && ' border-l-[1px] border-zinc-300'
              )}
            >
              <LocaleDayComponent date={date} />
            </div>
          ))}
      </div>
      <div className="grid grid-cols-7">
        {new Array(7 * 6)
          .fill(null)
          .map((_value, index) => ({
            date: addDays(firstDayInCalendarView, index),
          }))
          .map(({ date }, index) => ({
            date,
            isCurrentMonth: isSameMonth(date, currentDate),
            isToday: isSameDay(date, new Date()),
            isTopLeftCorner: index === 0,
            isTopRightCorner: index === 6,
            isBottomLeftCorner: index === 7 * 5,
            isBottomRightCorner: index === 7 * 6,
            items: itemByDay?.get(date.toISOString()),
          }))
          .map(
            ({
              date,
              isCurrentMonth,
              isToday,
              isBottomLeftCorner,
              isBottomRightCorner,
              isTopLeftCorner,
              isTopRightCorner,
              items,
            }) => (
              <div
                key={date.getTime()}
                className={cx(
                  isCurrentMonth ? 'bg-zinc-200' : 'bg-zinc-100',
                  isTopLeftCorner && 'rounded-tl',
                  isTopRightCorner && 'rounded-tr',
                  isBottomLeftCorner && 'rounded-bl',
                  isBottomRightCorner && 'rounded-br',
                  'w-full h-[140px] p-2 border border-zinc-300 flex-col justify-start items-start inline-flex overflow-clip'
                )}
              >
                <div className="flex items-center">
                  <div className="text-[16px] font-medium leading-normal">
                    {date.getDate()}
                  </div>
                  {isToday && (
                    <div className="w-2 h-2 ml-3 bg-[#fb8500] rounded-[36px]" />
                  )}
                </div>

                <div className="w-full mt-1">
                  {items && ItemComponent && (
                    <>
                      {items.slice(0, 2).map((item) => (
                        <ItemComponent key={item.key} {...item.item} />
                      ))}
                      {items.length > 2 && (
                        <div className=" text-[12px] -mt-1">
                          <Plural
                            value={items.length - 2}
                            one="+ 1 more"
                            other="+ # more"
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )
          )}
      </div>
    </div>
  );
};
