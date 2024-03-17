import { useLingui } from '@lingui/react';
import { intlFormatDistance } from 'date-fns';
import { FC } from 'react';

export const RelativeTime: FC<{ to: Date }> = (props) => {
  const { to } = props;
  const { i18n } = useLingui();

  return (
    <>
      {intlFormatDistance(to, new Date(), {
        locale: i18n.locale,
      })}
    </>
  );
};
