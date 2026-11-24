import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from './Button.jsx';

export const ErrorState = ({
  title = 'Failed to load data',
  message = 'An unexpected error occurred while fetching information.',
  onRetry,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-10 bg-white rounded-xl border border-rose-200 bg-rose-50/20 ${className}`}>
      <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 mb-4">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mb-5">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" size="sm" icon={RotateCcw}>
          Retry
        </Button>
      )}
    </div>
  );
};
