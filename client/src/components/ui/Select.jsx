import React, { forwardRef } from 'react';

export const Select = forwardRef(({
  label,
  options = [],
  error,
  helperText,
  placeholder = 'Select an option',
  className = '',
  id,
  children,
  ...props
}, ref) => {
  const selectId = id || props.name;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        className={`block w-full rounded-lg border text-sm transition-colors py-2 px-3 bg-white
          ${error
            ? 'border-rose-300 text-rose-900 focus:border-rose-500 focus:ring-rose-500 bg-rose-50/30'
            : 'border-slate-300 text-slate-900 focus:border-brand-500 focus:ring-brand-500'
          }
          focus:outline-none focus:ring-1 disabled:bg-slate-50 disabled:text-slate-500
          ${className}`}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {children || options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-xs text-rose-600 font-medium">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-xs text-slate-500">{helperText}</p>
      )}
    </div>
  );
});

Select.displayName = 'Select';
