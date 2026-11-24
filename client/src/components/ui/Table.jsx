import React from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

export const Table = ({ children, className = '' }) => {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className={`w-full text-left text-sm text-slate-600 ${className}`}>
        {children}
      </table>
    </div>
  );
};

export const TableHeader = ({ children, className = '' }) => {
  return (
    <thead className={`bg-slate-50/80 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200 ${className}`}>
      {children}
    </thead>
  );
};

export const TableBody = ({ children, className = '' }) => {
  return (
    <tbody className={`divide-y divide-slate-100 ${className}`}>
      {children}
    </tbody>
  );
};

export const TableRow = ({ children, onClick, className = '', hoverable = true }) => {
  return (
    <tr
      onClick={onClick}
      className={`transition-colors ${hoverable ? 'hover:bg-slate-50/70' : ''} ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </tr>
  );
};

export const TableHead = ({
  children,
  className = '',
  sortable = false,
  sortDirection = null,
  onSort
}) => {
  return (
    <th
      scope="col"
      onClick={sortable ? onSort : undefined}
      className={`px-4 py-3.5 tracking-wider ${sortable ? 'cursor-pointer select-none hover:text-slate-900 group' : ''} ${className}`}
    >
      <div className="flex items-center gap-1.5">
        <span>{children}</span>
        {sortable && (
          <span className="text-slate-400 group-hover:text-slate-700">
            {sortDirection === 'asc' ? (
              <ChevronUp className="w-3.5 h-3.5 text-brand-600" />
            ) : sortDirection === 'desc' ? (
              <ChevronDown className="w-3.5 h-3.5 text-brand-600" />
            ) : (
              <ChevronsUpDown className="w-3.5 h-3.5 opacity-60" />
            )}
          </span>
        )}
      </div>
    </th>
  );
};

export const TableCell = ({ children, className = '' }) => {
  return (
    <td className={`px-4 py-3.5 align-middle ${className}`}>
      {children}
    </td>
  );
};
