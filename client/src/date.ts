import { formatDistance } from 'date-fns';

export const relativeTimeTo = (to: Date) => {
  return formatDistance(to, new Date(), { addSuffix: true });
};
