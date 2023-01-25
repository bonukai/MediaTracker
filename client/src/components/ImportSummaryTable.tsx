import { t, Trans } from '@lingui/macro';
import React, { FunctionComponent } from 'react';

export const TvImportSummaryTableRowComponent: FunctionComponent<{
  title: string;
  exported: {
    movies?: number;
    shows?: number;
    seasons?: number;
    episodes?: number;
  };
  imported: {
    movies?: number;
    shows?: number;
    seasons?: number;
    episodes?: number;
  };
}> = (props) => {
  const { title, exported, imported } = props;

  return (
    <tr className="divide-x">
      <td className="py-2 pr-4 text-md whitespace-nowrap">{title}</td>
      <TvImportSummaryTableCellComponent
        exported={exported.movies}
        imported={imported.movies}
      />
      <TvImportSummaryTableCellComponent
        exported={exported.shows}
        imported={imported.shows}
      />
      <TvImportSummaryTableCellComponent
        exported={exported.seasons}
        imported={imported.seasons}
      />
      <TvImportSummaryTableCellComponent
        exported={exported.episodes}
        imported={imported.episodes}
      />
    </tr>
  );
};

const TvImportSummaryTableCellComponent: FunctionComponent<{
  exported?: number;
  imported?: number;
}> = (props) => {
  const { exported, imported } = props;

  return (
    <td className="text-sm text-center">
      {exported > 0 && (
        <>
          {exported} / {imported ? imported : '?'}
        </>
      )}
    </td>
  );
};

export const TvImportSummaryTable: FunctionComponent<{
  rows: {
    key?: string;
    title: string;
    exported: {
      movies?: number;
      shows?: number;
      seasons?: number;
      episodes?: number;
    };
    imported: {
      movies?: number;
      shows?: number;
      seasons?: number;
      episodes?: number;
    };
  }[];
}> = (props) => {
  const { children, rows } = props;

  return (
    <>
      <div className="my-4 text-2xl font-bold text-center">
        <Trans>Summary</Trans>
      </div>
      <table className="w-full divide-y divide-gray-300 table-auto">
        <thead>
          <tr className="divide-x">
            <th className="w-[1%]"></th>
            <HeaderCell header={t`Movies`} />
            <HeaderCell header={t`Shows`} />
            <HeaderCell header={t`Seasons`} />
            <HeaderCell header={t`Episodes`} />
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((data) => (
            <TvImportSummaryTableRowComponent
              key={data.key || data.title}
              exported={data.exported}
              imported={data.imported}
              title={data.title}
            />
          ))}
        </tbody>
        {/* <tbody className="divide-y">{children}</tbody> */}
      </table>
    </>
  );
};

const HeaderCell: FunctionComponent<{ header: string }> = (props) => {
  const { header: name } = props;

  return (
    <th className="py-2 text-lg font-semibold writing-mode-vertical sm:writing-mode-initial">
      {name}
    </th>
  );
};
