import { FC, useRef } from 'react';

import { Trans } from '@lingui/macro';

import { RouterOutput, trpc } from '../utils/trpc';
import { Button } from './Button';
import { dialogActionFactory } from './Dialog';
import { AddIcon, DeleteIcon } from './Icons';
import { justWatchLogo } from './Logos';

export const JustWatchProvidersSelector: FC<{
  selectedJustWatchProviders: number[];
  setSelectedJustWatchProviders: (value: number[]) => void;
}> = (props) => {
  const { selectedJustWatchProviders, setSelectedJustWatchProviders } = props;
  const justWatchProvidersQuery = trpc.justWatchProvider.getAll.useQuery();
  const justWatchProviderMap = new Map(
    justWatchProvidersQuery.data?.map((item) => [item.id, item]) || []
  );

  return (
    <div className="pb-8">
      <div className="flex flex-wrap gap-2 p-2 overflow-y-auto rounded bg-slate-200 w-fit max-h-28">
        {selectedJustWatchProviders.map((id) => (
          <span
            key={id}
            className="flex items-center gap-2 px-1 py-0.5 rounded bg-slate-400 w-fit text-sm text-slate-900"
          >
            <img
              src={justWatchProviderMap.get(id)?.logo}
              className="h-4 rounded w-fit"
            />
            {justWatchProviderMap.get(id)?.name}
            <div
              onClick={() =>
                setSelectedJustWatchProviders([
                  ...selectedJustWatchProviders.filter((item) => item !== id),
                ])
              }
            >
              <DeleteIcon className="h-4 w-fit fill-red-600" />
            </div>
          </span>
        ))}

        <SelectProviderDialog
          selectProvider={(id) =>
            setSelectedJustWatchProviders([...selectedJustWatchProviders, id])
          }
          justWatchProviders={
            justWatchProvidersQuery.data?.filter(
              (item) => !selectedJustWatchProviders.includes(item.id)
            ) || []
          }
        >
          <Button
            className="h-min"
            preventDefault
            type="secondary"
            text={<Trans>Add provider</Trans>}
            icon={<AddIcon />}
          />
        </SelectProviderDialog>
      </div>
    </div>
  );
};

const SelectProviderDialog = dialogActionFactory<{
  selectProvider: (id: number) => void;
  justWatchProviders: RouterOutput['justWatchProvider']['getAll'];
}>((props) => {
  const { justWatchProviders, selectProvider, closeDialog } = props;
  const justWatchProviderSelectRef = useRef<HTMLSelectElement>(null);

  return (
    <>
      <div className="mb-6 text-lg font-semibold">
        <Trans>Select JustWatch provider</Trans>
      </div>

      <select ref={justWatchProviderSelectRef}>
        {justWatchProviders.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>

      <div className="flex justify-between mt-4">
        <Button
          onClick={() => {
            const id = justWatchProviderSelectRef.current?.value;

            if (typeof id !== 'string') {
              return;
            }

            selectProvider(parseInt(id));
            closeDialog();
          }}
          text={<Trans>Select provider</Trans>}
        />
        <Button
          type="secondary"
          color="red"
          onClick={() => closeDialog()}
          text={<Trans>Cancel</Trans>}
        />
      </div>

      <a
        className="block pt-4"
        target="_blank"
        href="https://www.justwatch.com/"
      >
        <img alt="JustWatch" className="h-4" src={justWatchLogo} />
      </a>
    </>
  );
});
