import React, { forwardRef } from 'react';

export const Textarea = forwardRef(({
  label,
  error,
  helperText,
  maxLength,
  value,
  className = '',
  rows = 4,
  id,
  ...props
}, ref) => {
  const textareaId = id || props.name;
  const currentLength = typeof value === 'string' ? value.length : undefined;

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1.5">
        {label && (
          <label htmlFor={textareaId} className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
            {label}
          </label>
        )}
        {maxLength && currentLength !== undefined && (
          <span className="text-xs text-slate-400">
            {currentLength} / {maxLength}
          </span>
        )}
      </div>
      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        maxLength={maxLength}
        value={value}
        className={`block w-full rounded-lg border text-sm transition-colors py-2 px-3
          ${error
            ? 'border-rose-300 text-rose-900 focus:border-rose-500 focus:ring-rose-500 bg-rose-50/30'
            : 'border-slate-300 text-slate-900 focus:border-brand-500 focus:ring-brand-500 bg-white'
          }
          placeholder:text-slate-400 focus:outline-none focus:ring-1 disabled:bg-slate-50 disabled:text-slate-500
          ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-xs text-rose-600 font-medium">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-xs text-slate-500">{helperText}</p>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';
