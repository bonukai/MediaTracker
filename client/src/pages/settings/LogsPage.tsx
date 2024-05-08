import { FC } from 'react';
import { useUser } from '../../hooks/useUser';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { trpc } from '../../utils/trpc';
import { MainTitle } from '../../components/MainTitle';
import { Trans } from '@lingui/macro';

export const LogsPage: FC = () => {
  const { user } = useUser();
  const logs = trpc.logs.getLogFiles.useQuery();

  if (logs.isLoading) {
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
      <MainTitle elements={[<Trans>Settings</Trans>, <Trans>Logs</Trans>]} />

      {logs.data?.map((log) => (
        <div key={log} className="">
          <Link to={`./details?filename=${log}`}>{log}</Link>
        </div>
      ))}
    </>
  );
};

export const LogPage: FC = () => {
  const [searchParams] = useSearchParams();
  const logFileName = searchParams.get('filename');
  const { user } = useUser();

  if (!logFileName) {
    throw new Error(`search param "filename" is required`);
  }
  const logFile = trpc.logs.getLogFile.useQuery({
    filename: logFileName,
  });

  if (logFile.isLoading) {
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
      <MainTitle elements={[<Trans>Settings</Trans>, <Trans>Logs</Trans>]} />

      {logFile.data && (
        <div className="font-mono whitespace-break-spaces">{logFile.data}</div>
      )}
    </>
  );
};
