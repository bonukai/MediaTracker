import { FC } from 'react';
import { Navigate } from 'react-router-dom';

import { Trans } from '@lingui/macro';

import { Accent } from '../../components/Accent';
import { Button } from '../../components/Button';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { RelativeTime } from '../../components/Date';
import { Form } from '../../components/Form';
import { AddIcon, DeleteIcon } from '../../components/Icons';
import { MainTitle } from '../../components/MainTitle';
import { DialogAction } from '../../components/MediaItemActionButtons';
import { useUser } from '../../hooks/useUser';
import { trpc } from '../../utils/trpc';
import { EmbeddedSingleLineCodeWithCopyButton } from '../../components/EmbeddedSingleLineCodeWithCopyButton';

export const ApplicationTokens: FC = () => {
  const { user } = useUser();
  const utils = trpc.useUtils();
  const invalidate = () => {
    utils.applicationToken.invalidate();
  };
  const tokensQuery = trpc.applicationToken.getAll.useQuery();
  const deleteTokenMutation = trpc.applicationToken.delete.useMutation({
    onSuccess: invalidate,
  });

  if (tokensQuery.isLoading) {
    return <>Loading</>;
  }

  if (!user.data) {
    return <></>;
  }

  if (user.data.admin !== true) {
    return <Navigate to="/" />;
  }

  return (
    <>
      <MainTitle
        elements={[<Trans>Settings</Trans>, <Trans>Application tokens</Trans>]}
      />

      <div>
        <DialogAction
          dialogContent={(closeDialog) => (
            <CreateTokenForm closeDialog={closeDialog} />
          )}
        >
          <Button icon={<AddIcon />} text={<Trans>Create token</Trans>} />
        </DialogAction>
      </div>

      <table className="mt-8">
        <tbody>
          {tokensQuery.data?.map((token) => (
            <tr key={token.id} className="">
              <td className="p-2">{token.description}</td>
              <td className="p-2">
                {new Date(token.createdAt).toLocaleString()}
              </td>
              <td className="p-2">
                {token.lastUsedAt ? (
                  <>
                    <RelativeTime to={new Date(token.lastUsedAt)} />
                  </>
                ) : (
                  <Trans>Never used</Trans>
                )}
              </td>
              <td className="p-2">
                <ConfirmDialog
                  content={
                    <Trans>
                      Are you sure, you want to delete token{' '}
                      <Accent>{token.description}</Accent>?
                    </Trans>
                  }
                  onConfirmed={() =>
                    deleteTokenMutation.mutate({ tokenId: token.id })
                  }
                >
                  <Button
                    isLoading={
                      deleteTokenMutation.variables?.tokenId === token.id &&
                      deleteTokenMutation.isLoading
                    }
                    icon={<DeleteIcon />}
                    text={<Trans>Delete token</Trans>}
                    type="secondary"
                    color="red"
                  />
                </ConfirmDialog>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
};

const CreateTokenForm: FC<{ closeDialog: () => void }> = (props) => {
  const { closeDialog } = props;
  const utils = trpc.useUtils();
  const invalidate = () => {
    utils.applicationToken.invalidate();
  };
  const createTokenMutation = trpc.applicationToken.create.useMutation({
    onSuccess: invalidate,
  });

  return (
    <Form<{ description: string }>
      onSubmit={({ data }) => {
        createTokenMutation.mutateAsync({
          name: data.description,
          createdBy: 'user',
        });
      }}
    >
      {({ TextInput }) => (
        <>
          <div className="mb-6 text-xl font-semibold md:w-96">
            <Trans>Create application token</Trans>
          </div>

          {createTokenMutation.data ? (
            <div className="mb-4">
              <EmbeddedSingleLineCodeWithCopyButton
                code={createTokenMutation.data}
              />

              <div className="mt-4 italic text-slate-500">
                <Trans>This token will never be shown again</Trans>
              </div>
            </div>
          ) : (
            <TextInput
              inputName="description"
              title={<Trans>Token description</Trans>}
              required
              minLength={3}
            />
          )}

          <div className="flex justify-between">
            {createTokenMutation.data ? (
              <div></div>
            ) : (
              <Button
                actionType="submit"
                icon={<AddIcon />}
                text={<Trans>Create token</Trans>}
                isLoading={createTokenMutation.isLoading}
              />
            )}

            <Button
              preventDefault
              type="secondary"
              color="red"
              text={<Trans>Close</Trans>}
              onClick={closeDialog}
            />
          </div>
        </>
      )}
    </Form>
  );
};
