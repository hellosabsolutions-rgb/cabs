import { useState, useMemo, useEffect } from 'react';

export interface UsePaginationOptions {
  initialPageSize?: number;
  initialPage?: number;
}

export function usePagination<T>(items: T[], options: UsePaginationOptions | number = 10) {
  const initialPageSize = typeof options === 'number' ? options : (options.initialPageSize ?? 10);
  const initialPage = typeof options === 'number' ? 1 : (options.initialPage ?? 1);

  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [pageSize, setPageSize] = useState<number>(initialPageSize);

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // If items change or filter shrinks total items, clamp page to valid range
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, currentPage, pageSize]);

  const handlePageChange = (page: number) => {
    const clamped = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(clamped);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  return {
    currentPage,
    setCurrentPage: handlePageChange,
    pageSize,
    setPageSize: handlePageSizeChange,
    totalItems,
    totalPages,
    paginatedItems
  };
}
