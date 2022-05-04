import React, { FunctionComponent } from 'react';
import ReactDOM from 'react-dom';
import { Trans } from '@lingui/macro';
import { I18nProvider } from '@lingui/react';
import { i18n } from '@lingui/core';

import { Modal } from 'src/components/Modal';

export const Confirm = async (message: string) => {
  const portal = document.getElementById('portal');
  const node = document.createElement('div');

  portal.appendChild(node);

  return await new Promise<boolean>((resolve) => {
    ReactDOM.render(
      <React.StrictMode>
        <I18nProvider i18n={i18n}>
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
          </Modal>
        </I18nProvider>
      </React.StrictMode>,
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
