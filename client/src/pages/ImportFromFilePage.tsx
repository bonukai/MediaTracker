import { FC, ReactNode, useState } from 'react';

import { Trans } from '@lingui/macro';
import { animated, useSpring } from '@react-spring/web';

import { Accent } from '../components/Accent';
import { Button } from '../components/Button';
import { cx } from '../utils';
import { trpc } from '../utils/trpc';

import type { ItemType } from '@server/entity/mediaItemModel';
import type {
  ImportDetails,
  ImportDetailsPerItemType,
} from '@server/repository/importRepository';
import type { ImportSource } from '@server/routers/importRouter';
export const ImportFormFilePage: FC<{
  source: ImportSource;
  fileType: string;
  itemTypes: ItemType[];
  instructions: React.JSX.Element;
}> = ({ source, fileType, itemTypes, instructions }) => {
  const [file, setFile] = useState<File>();
  const utils = trpc.useUtils();
  const importFromFile = trpc.import.fromFile.useMutation({
    onMutate: () => {
      utils.import.progress.invalidate({ source });
    },
  });
  const importProgressQuery = trpc.import.progress.useQuery(
    { source },
    { refetchInterval: importFromFile.isLoading ? 0.1 : 0 }
  );

  const resetProgressMutation = trpc.import.resetProgress.useMutation({
    onSuccess: () => {
      utils.import.progress.invalidate({ source });
    },
  });

  const step: 'upload' | 'import' =
    importProgressQuery.data && !importFromFile.isError ? 'import' : 'upload';

  return (
    <>
      <div className="flex flex-col mt-4">
        <div>
          {step === 'upload' && (
            <>
              <div className="">{instructions}</div>

              <div className="flex flex-col">
                <input
                  type="file"
                  className="mt-8 md:w-96"
                  accept={fileType}
                  multiple={false}
                  onChange={(e) =>
                    setFile(e.currentTarget.files?.item(0) || undefined)
                  }
                />
                {importFromFile.isError && (
                  <div className="text-red-600">
                    <Trans>Unexpected file format</Trans><br/>
                    <pre>{ importFromFile.variables?.source == 'CSV' ? importFromFile.error.message : "" }</pre>
                  </div>
                )}
                {file && (
                  <Button
                    className="mt-4 w-fit"
                    text={<Trans>Import</Trans>}
                    onClick={async () => {
                      importFromFile.mutate({
                        source,
                        data: await file.text(),
                      });
                    }}
                    isLoading={importFromFile.isLoading}
                    preventDefault
                  />
                )}
              </div>
            </>
          )}
          {step === 'import' && (
            <>
              <div className="mb-4 text-2xl text-center">
                {importProgressQuery?.data?.state === 'parsing-input-file' && (
                  <Trans>Parsing input file</Trans>
                )}
                {importProgressQuery?.data?.state === 'imported' && (
                  <Trans>Imported</Trans>
                )}
                {importProgressQuery?.data?.state === 'importing' && (
                  <Trans>Importing</Trans>
                )}
                {importProgressQuery?.data?.state ===
                  'looking-in-external-providers' && (
                  <Trans>Looking in external providers</Trans>
                )}
                {importProgressQuery?.data?.state ===
                  'looking-in-local-database' && (
                  <Trans>Looking in local database</Trans>
                )}
                {importProgressQuery?.data?.state === 'updating-metadata' && (
                  <Trans>Updating metadata</Trans>
                )}
              </div>

              {importProgressQuery.data && (
                <div className="flex justify-center">
                  <ProgressBarComponent
                    progress={importProgressQuery.data.progress || 0}
                  />
                </div>
              )}

              {importProgressQuery.data?.details && (
                <ImportTable
                  importDetails={importProgressQuery.data?.details}
                  itemTypes={itemTypes}
                />
              )}

              {importProgressQuery.data?.details?.seenHistory?.movie?.notFound?.map(
                (item) => <div key={JSON.stringify(item)}>{item.title}</div>
              )}

              {importProgressQuery.data?.state === 'imported' && (
                <Button
                  onClick={() => resetProgressMutation.mutate({ source })}
                  text={<Trans>Reset progress</Trans>}
                />
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

const ProgressBarComponent: FC<{ progress: number }> = (props) => {
  const progress = props.progress * 100;

  const style = useSpring({
    width: `${progress}%`,
  });

  return (
    <div className="relative block h-6 rounded w-96 bg-slate-400">
      <animated.div
        className={cx(
          'h-full bg-blue-500 rounded-l',
          progress >= 100 && 'rounded'
        )}
        style={style}
      ></animated.div>
    </div>
  );
};

const ImportTable: FC<{
  importDetails: ImportDetails;
  itemTypes: Array<ItemType>;
}> = ({ importDetails, itemTypes }) => {
  return (
    <table className="my-4">
      <thead>
        <tr>
          <th></th>
          {itemTypes.includes('movie') && (
            <Header value={<Trans>Movie</Trans>} />
          )}
          {itemTypes.includes('tv') && (
            <Header value={<Trans>Tv Show</Trans>} />
          )}
          {itemTypes.includes('season') && (
            <Header value={<Trans>Season</Trans>} />
          )}
          {itemTypes.includes('episode') && (
            <Header value={<Trans>Episode</Trans>} />
          )}
          {itemTypes.includes('video_game') && (
            <Header value={<Trans>Video games</Trans>} />
          )}
          {itemTypes.includes('audiobook') && (
            <Header value={<Trans>Audiobook</Trans>} />
          )}
          {itemTypes.includes('book') && (
            <Header value={<Trans>Books</Trans>} />
          )}
        </tr>
      </thead>
      <tbody>
        <Row
          type={<Trans>Ratings</Trans>}
          importDetails={importDetails.rating}
          itemTypes={itemTypes}
        />
        <Row
          type={<Trans>Watchlist</Trans>}
          importDetails={importDetails.watchlist}
          itemTypes={itemTypes}
        />
        <Row
          type={<Trans>Seen history</Trans>}
          importDetails={importDetails.seenHistory}
          itemTypes={itemTypes}
        />
        {importDetails.lists?.map((list) => (
          <Row
            key={list.name}
            type={
              <Trans>
                List <Accent>{list.name}</Accent>
              </Trans>
            }
            importDetails={list.items}
            itemTypes={itemTypes}
          />
        ))}
      </tbody>
    </table>
  );
};

const Header: FC<{ value: ReactNode }> = ({ value }) => {
  return <th className="px-6 py-3 border-l border-slate-600">{value}</th>;
};

const Row: FC<{
  type: ReactNode;
  importDetails?: ImportDetailsPerItemType;
  itemTypes: Array<ItemType>;
}> = ({ type, importDetails, itemTypes }) => {
  const allItemTypes: ItemType[] = [
    'movie',
    'tv',
    'season',
    'episode',
    'video_game',
    'audiobook',
    'book',
  ];

  return (
    <tr className="border-t border-slate-600">
      <td className="px-6 py-3 bold">{type}</td>
      {allItemTypes
        .filter((item) => itemTypes.includes(item))
        .map((item) => (
          <Cell key={item} data={importDetails ? importDetails[item] : null} />
        ))}
    </tr>
  );
};

const Cell: FC<{
  data: { found: number; total: number } | null;
}> = ({ data }) => {
  return (
    <td className="px-6 py-3 text-center border-l border-slate-600">
      {data && (
        <>
          {data.found} / {data.total}
        </>
      )}
    </td>
  );
};
