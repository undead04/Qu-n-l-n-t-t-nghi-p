"use client";
import { useEffect, useState } from "react";

interface TableWithPaginationProps<T> {
  totalLength: number;
  pageSize?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
}

export interface IPagination {
  TotalRecords: number;
  TotalPages: number;
  PageSize: number;
  CurrentPage: number;
}

export function Pagination<T extends { [key: string]: any }>({
  totalLength,
  pageSize = 10,
  currentPage = 1,
  onPageChange,
}: TableWithPaginationProps<T>) {
  const [page, setPage] = useState(currentPage);
  const totalPages = Math.ceil(totalLength / pageSize);
  useEffect(() => {
    setPage(currentPage);
  }, [currentPage]);
  return (
    <>
      {/* Pagination controls */}
      <div className="flex justify-between items-center px-4 py-3 bg-gray-50 text-sm">
        <span>{`Trang ${page} / ${totalPages || 1}`}</span>
        <div className="flex gap-2">
          <button
            disabled={page === 1}
            onClick={() =>
              onPageChange?.(page - 1) || setPage((p) => Math.max(1, p - 1))
            }
            className="px-3 py-1 rounded bg-white border shadow-sm hover:bg-gray-100 disabled:opacity-50"
          >
            ◀ Trước
          </button>
          <button
            disabled={page === totalPages || totalPages === 0}
            onClick={() =>
              onPageChange?.(page + 1) ||
              setPage((p) => Math.min(totalPages, p + 1))
            }
            className="px-3 py-1 rounded bg-white border shadow-sm hover:bg-gray-100 disabled:opacity-50"
          >
            Sau ▶
          </button>
        </div>
      </div>
    </>
  );
}
