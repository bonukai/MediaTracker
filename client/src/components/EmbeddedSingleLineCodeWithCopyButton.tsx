import { FC } from 'react';

import { Trans } from '@lingui/macro';

import { Button } from './Button';
import { CopyContentIcon } from './Icons';
import { canCopyToClipboard, copyTextToClipboard } from '../utils';

export const EmbeddedSingleLineCodeWithCopyButton: FC<{ code: string }> = (
  props
) => {
  const { code } = props;

  return (
    <div className="flex items-center gap-2 p-2 rounded bg-slate-300 text-slate-700 w-fit">
      <div className="line-clamp-1">{code}</div>
      {canCopyToClipboard() && (
        <Button
          preventDefault
          onClick={() => {
            copyTextToClipboard(code);

            return {
              showTooltip: {
                content: <Trans>Copied to clipboard</Trans>,
                position: 'left',
              },
            };
          }}
          icon={<CopyContentIcon className="h-5 w-min" />}
        />
      )}
    </div>
  );
};
