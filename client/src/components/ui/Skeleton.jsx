import React from 'react';

export const Skeleton = ({ className = '', ...props }) => {
  return (
    <div
      className={`animate-pulse bg-slate-200/80 rounded-lg ${className}`}
      {...props}
    />
  );
};

export const CardSkeleton = () => {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 space-y-3">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-3 w-3/4" />
    </div>
  );
};

export const TableSkeleton = ({ rows = 5 }) => {
  return (
    <div className="w-full bg-white rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
      <div className="p-4 bg-slate-50 flex gap-4">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-4 flex gap-4 items-center">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-1/6" />
          <Skeleton className="h-4 w-1/6" />
          <Skeleton className="h-4 w-1/4" />
        </div>
      ))}
    </div>
  );
};
