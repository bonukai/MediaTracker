import { Trans } from '@lingui/macro';
import clsx from 'clsx';
import React, { FunctionComponent } from 'react';

export const ImportSummaryTable: FunctionComponent<{
  columns: string[];
  rows: string[];
  exported: number[][];
  imported: number[][];
}> = (props) => {
  const { columns, rows, exported, imported } = props;

  return (
    <>
      <div className="my-4 text-2xl font-bold text-center">
        <Trans>Summary</Trans>
      </div>
      <table className="w-full divide-y divide-gray-300 table-auto">
        <thead>
          <tr className="divide-x">
            <th className="w-[1%]"></th>
            {columns.map((column) => (
              <th
                key={column}
                className={clsx(
                  'py-2 text-lg font-semibold',
                  columns.length > 2 &&
                    'writing-mode-vertical sm:writing-mode-initial'
                )}
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((row, rowIndex) => (
            <tr key={row} className="divide-x">
              <td className="py-2 pr-4 text-md whitespace-nowrap">{row}</td>
              {columns.map((column, columnIndex) => (
                <td key={column} className="text-sm text-center">
                  {exported.at(rowIndex)?.at(columnIndex) ? (
                    <>
                      {imported.at(rowIndex)?.at(columnIndex) || '?'} /{' '}
                      {exported.at(rowIndex)?.at(columnIndex)}
                    </>
                  ) : (
                    <></>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
};
