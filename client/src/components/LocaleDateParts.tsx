import { useLingui } from '@lingui/react';
import { FC } from 'react';

export const LocaleMonthComponent: FC<{ date: Date }> = (props) => {
  const { date } = props;
  const { i18n } = useLingui();

  const datePartsMap = formatDateToParts(date, i18n.locale);

  return <>{datePartsMap.get('month')}</>;
};

export const LocaleMonthShortComponent: FC<{ date: Date }> = (props) => {
  const { date } = props;
  const { i18n } = useLingui();

  const datePartsMap = formatDateToParts(date, i18n.locale, 'medium');

  return <>{datePartsMap.get('month')}</>;
};

export const LocaleMonthYearComponent: FC<{ date: Date }> = (props) => {
  const { date } = props;
  const { i18n } = useLingui();

  const datePartsMap = formatDateToParts(date, i18n.locale);

  return (
    <>
      {datePartsMap.get('month')} {datePartsMap.get('year')}
    </>
  );
};

export const LocaleDayComponent: FC<{ date: Date }> = (props) => {
  const { date } = props;
  const { i18n } = useLingui();

  const datePartsMap = formatDateToParts(date, i18n.locale);

  return <>{datePartsMap.get('weekday')}</>;
};

const formatDateToParts = (
  date: Date,
  locale: string,
  dateStyle?: 'full' | 'long' | 'medium' | 'short'
) => {
  const dateParts = new Intl.DateTimeFormat(locale, {
    dateStyle: dateStyle || 'full',
  }).formatToParts(date);

  return dateParts.reduce(
    (res, current) => res.set(current.type, current.value),
    new Map<keyof Intl.DateTimeFormatPartTypesRegistry, string>()
  );
};

export const LocaleDateComponent: FC<{
  date: Date;
  options: Intl.DateTimeFormatOptions;
}> = (props) => {
  const { date, options } = props;
  const { i18n } = useLingui();

  return <>{new Intl.DateTimeFormat(i18n.locale, options).format(date)}</>;
};
