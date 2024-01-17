import { FC, Fragment, ReactNode, useEffect, useState } from 'react';
import { cx } from '../utils';
import { ChevronLeftIcon, ChevronRightIcon } from './Icons';

// eslint-disable-next-line react-refresh/only-export-components
export const usePagination = () => {
  const [currentPageNumber, setCurrentPageNumber] = useState<number>(1);

  useEffect(() => {
    window.scrollTo({
      behavior: 'smooth',
      top: 0,
    });
  }, [currentPageNumber]);

  const PaginationComponent: FC<{ numberOfPages: number | undefined }> = (
    props
  ) => {
    return (
      <Pagination
        numberOfPages={props.numberOfPages}
        pageNumber={currentPageNumber}
        setPageNumber={setCurrentPageNumber}
      />
    );
  };

  return {
    currentPageNumber,
    PaginationComponent,
  };
};

export const Pagination: FC<{
  numberOfPages: number | undefined;
  pageNumber: number;
  setPageNumber: (page: number) => void;
}> = (props) => {
  const { numberOfPages, pageNumber, setPageNumber } = props;

  if (typeof numberOfPages !== 'number' || numberOfPages <= 1) {
    return <></>;
  }

  const isFirstPage = pageNumber === 1;
  const isLastPage = pageNumber === numberOfPages;

  const ranges = getRanges({ pageNumber, numberOfPages });

  return (
    <div className="flex items-center justify-center gap-4 m-6 ">
      <PaginationElement
        onClick={() => setPageNumber(pageNumber - 1)}
        enabled={!isFirstPage}
      >
        <ChevronLeftIcon className="fill-current" />
      </PaginationElement>

      {ranges
        .map((range, index) => ({
          range,
          nextRange: ranges[index + 1],
          array: new Array(range.to - range.from + 1)
            .fill(null)
            .map((_, index) => range.from + index),
        }))
        .map((item, index) => ({
          array: item.array,
          addDots:
            index < ranges.length - 1 &&
            (item.nextRange === undefined
              ? true
              : item.range.to + 1 < item.nextRange.from),
          key: [item.range.from, item.range.to].toString(),
        }))
        .map(({ array, addDots, key }) => (
          <Fragment key={key}>
            {array.map((currentPageNumber) => (
              <PaginationElement
                key={currentPageNumber}
                isActive={currentPageNumber === pageNumber}
                onClick={() => setPageNumber(currentPageNumber)}
                enabled={true}
              >
                {currentPageNumber}
              </PaginationElement>
            ))}

            {addDots && <span className="select-none">...</span>}
          </Fragment>
        ))}

      <PaginationElement
        onClick={() => setPageNumber(pageNumber + 1)}
        enabled={!isLastPage}
      >
        <ChevronRightIcon className="fill-current" />
      </PaginationElement>
    </div>
  );
};

const PaginationElement: FC<{
  isActive?: boolean;
  children: ReactNode;
  onClick: () => void;
  enabled: boolean;
}> = (props) => {
  const { isActive, children, onClick, enabled } = props;

  return (
    <div
      className={cx(
        'select-none flex justify-center items-center aspect-square  rounded-full border-slate-600 border text-slate-800  cursor-pointer p-1 w-fit',
        isActive && 'bg-orange-500',
        !enabled && 'cursor-default text-slate-300'
      )}
      onClick={() => enabled && onClick()}
    >
      {children}
    </div>
  );
};

type PageRange = { from: number; to: number };
type PageRanges =
  | [PageRange]
  | [PageRange, PageRange]
  | [PageRange, PageRange, PageRange];

const getRanges = (args: {
  pageNumber: number;
  numberOfPages: number;
}): PageRanges => {
  const { pageNumber, numberOfPages } = args;

  const ranges = [
    {
      from: 1,
      to: 3,
    },
    {
      from: pageNumber - 1,
      to: pageNumber + 1,
    },
    {
      from: numberOfPages - 3 + 1,
      to: numberOfPages,
    },
  ];

  const [firstRange, middleRange, lastRange] = ranges;

  if (middleRange.from <= firstRange.to) {
    return [
      {
        from: 1,
        to: Math.max(middleRange.to, firstRange.to),
      },
      lastRange,
    ];
  }

  if (middleRange.to >= lastRange.from) {
    return [
      firstRange,
      {
        from: Math.min(middleRange.from, lastRange.from),
        to: numberOfPages,
      },
    ];
  }

  return [firstRange, middleRange, lastRange];
};
