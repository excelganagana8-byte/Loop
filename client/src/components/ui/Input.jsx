import React, { forwardRef } from 'react';

export const Input = forwardRef(({
  label,
  error,
  helperText,
  className = '',
  id,
  type = 'text',
  icon: Icon,
  ...props
}, ref) => {
  const inputId = id || props.name;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
          {label}
        </label>
      )}
      <div className="relative rounded-lg shadow-sm">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          className={`block w-full rounded-lg border text-sm transition-colors
            ${Icon ? 'pl-9' : 'pl-3'} pr-3 py-2
            ${error
              ? 'border-rose-300 text-rose-900 focus:border-rose-500 focus:ring-rose-500 bg-rose-50/30'
              : 'border-slate-300 text-slate-900 focus:border-brand-500 focus:ring-brand-500 bg-white'
            }
            placeholder:text-slate-400 focus:outline-none focus:ring-1 disabled:bg-slate-50 disabled:text-slate-500
            ${className}`}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1 text-xs text-rose-600 font-medium">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-xs text-slate-500">{helperText}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
