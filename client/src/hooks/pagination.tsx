import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

export const usePagination = (args: {
  itemsPerPage: number;
  totalItems: number;
}) => {
  const [page, setPage] = useState(1);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.has('page') && Number(searchParams.get('page')) !== page) {
      setPage(Number(searchParams.get('page')));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    window.document.body.scrollIntoView({ behavior: 'auto' });

    if (page === 1) {
      setSearchParams(
        Object.fromEntries(
          Array.from(searchParams.entries()).filter(([name]) => name !== 'page')
        ),
        { replace: true }
      );
    } else {
      setSearchParams(
        {
          ...Object.fromEntries(searchParams.entries()),
          page: page.toString(),
        },
        { replace: true }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  return useMemo(() => {
    const numberOfPages = Math.ceil(args.totalItems / args.itemsPerPage) - 1;
    const from = args.itemsPerPage * (page - 1);
    const to = args.itemsPerPage * (page - 1) + args.itemsPerPage;
    const getPaginatedItems = <T,>(items?: Array<T>) => items?.slice(from, to);
    const showPaginationComponent = numberOfPages > 1;

    return {
      currentPage: page,
      numberOfPages,
      getPaginatedItems,
      setPage,
      showPaginationComponent,
    };
  }, [args.itemsPerPage, args.totalItems, page]);
};
