import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
  className = ''
}) => {
  if (totalPages <= 1 && totalItems <= pageSize) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 py-3 px-2 ${className}`}>
      <div className="text-xs text-slate-500">
        Showing <span className="font-medium text-slate-900">{totalItems > 0 ? startItem : 0}</span> to{' '}
        <span className="font-medium text-slate-900">{endItem}</span> of{' '}
        <span className="font-medium text-slate-900">{totalItems}</span> results
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="inline-flex items-center justify-center p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <span className="text-xs px-2.5 py-1 text-slate-600 font-medium">
          Page {currentPage} of {totalPages || 1}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="inline-flex items-center justify-center p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
