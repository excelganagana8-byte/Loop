import React from 'react';

export const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  dot = false,
  ...props
}) => {
  const variants = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    primary: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    info: 'bg-sky-50 text-sky-700 border-sky-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',

    // Specific domain variants
    POSITIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    NEGATIVE: 'bg-rose-50 text-rose-700 border-rose-200',
    NEUTRAL: 'bg-slate-100 text-slate-700 border-slate-200',
    UNKNOWN: 'bg-slate-100 text-slate-500 border-slate-200',

    BUG: 'bg-rose-50 text-rose-700 border-rose-200',
    FEATURE_REQUEST: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    PRICING: 'bg-amber-50 text-amber-700 border-amber-200',
    USABILITY: 'bg-blue-50 text-blue-700 border-blue-200',
    CUSTOMER_SUPPORT: 'bg-violet-50 text-violet-700 border-violet-200',
    PERFORMANCE: 'bg-orange-50 text-orange-700 border-orange-200',
    PRAISE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    OTHER: 'bg-slate-100 text-slate-600 border-slate-200',

    NEW: 'bg-sky-50 text-sky-700 border-sky-200',
    IN_REVIEW: 'bg-amber-50 text-amber-700 border-amber-200',
    RESOLVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    ARCHIVED: 'bg-slate-100 text-slate-500 border-slate-200',

    PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
    DONE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    FAILED: 'bg-rose-50 text-rose-700 border-rose-200'
  };

  const dotColors = {
    POSITIVE: 'bg-emerald-500',
    NEGATIVE: 'bg-rose-500',
    NEUTRAL: 'bg-slate-400',
    UNKNOWN: 'bg-slate-300',
    BUG: 'bg-rose-500',
    NEW: 'bg-sky-500',
    IN_REVIEW: 'bg-amber-500',
    RESOLVED: 'bg-emerald-500',
    ARCHIVED: 'bg-slate-400',
    PENDING: 'bg-amber-500',
    DONE: 'bg-emerald-500',
    FAILED: 'bg-rose-500'
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5'
  };

  const selectedVariant = variants[variant] || variants.default;
  const dotColor = dotColors[variant] || 'bg-current';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${sizes[size] || sizes.md} ${selectedVariant} ${className}`}
      {...props}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 shrink-0 ${dotColor}`} />
      )}
      {children}
    </span>
  );
};
