import React, { ReactNode } from 'react';
import { dialogActionFactory } from './Dialog';
import { Trans } from '@lingui/macro';
import { Button } from './Button';

export const ConfirmDialog = dialogActionFactory<{
  children: React.JSX.Element;
  content: ReactNode;
  onConfirmed: () => Promise<void> | void;
}>((props) => {
  const { content, onConfirmed, closeDialog } = props;

  return (
    <div className="md:max-w-lg">
      <div className="mb-4 text-xl font-semibold">{content}</div>
      <div className="flex justify-between">
        <Button
          text={<Trans>Yes</Trans>}
          onClick={() => {
            onConfirmed();
            closeDialog();
          }}
        />
        <Button
          type="secondary"
          text={<Trans>No</Trans>}
          onClick={closeDialog}
          color="red"
        />
      </div>
    </div>
  );
});
