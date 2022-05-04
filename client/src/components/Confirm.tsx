import React, { FunctionComponent } from 'react';
import ReactDOM from 'react-dom';
import { Trans } from '@lingui/macro';

import { Modal } from 'src/components/Modal';

export const Confirm = async (message: string) => {
  const portal = document.getElementById('portal');
  const node = document.createElement('div');

  portal.appendChild(node);

  return await new Promise<boolean>((resolve) => {
    ReactDOM.render(
      <Modal>
        {(closeModal) => (
          <ModalBody
            message={message}
            resolve={(res) => {
              closeModal();
              portal.removeChild(node);

              resolve(res);
            }}
          />
        )}
      </Modal>,
      node
    );
  });
};

const ModalBody: FunctionComponent<{
  resolve: (value: boolean) => void;
  message: string;
}> = (props) => {
  const { resolve, message } = props;

  return (
    <div className="flex flex-col p-3">
      <div className="mb-2 text-xl">{message}</div>
      <div className="flex">
        <div className="btn" onClick={() => resolve(true)}>
          <Trans>Yes</Trans>
        </div>
        <div className="ml-auto btn" onClick={() => resolve(false)}>
          <Trans>No</Trans>
        </div>
      </div>
    </div>
  );
};
