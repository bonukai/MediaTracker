import React, { FunctionComponent } from 'react';
import { useLingui } from '@lingui/react';
import { formatDistance } from 'date-fns';
import * as locale from 'date-fns/locale';

export const RelativeTime: FunctionComponent<{ to: Date }> = (props) => {
  const { to } = props;
  const lingui = useLingui();

  return (
    <>
      {formatDistance(to, new Date(), {
        locale: locale[lingui.i18n.locale],
        addSuffix: true,
      })}
    </>
  );
};
