import React from 'react';

export const Card = ({
  children,
  className = '',
  hoverable = false,
  ...props
}) => {
  return (
    <div
      className={`bg-white rounded-xl border border-slate-200/80 shadow-card transition-all ${
        hoverable ? 'hover:shadow-card-hover hover:border-slate-300 cursor-pointer' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '', title, description, action }) => {
  if (title || description || action) {
    return (
      <div className={`p-5 pb-3 border-b border-slate-100 flex items-start justify-between gap-4 ${className}`}>
        <div>
          {title && <h3 className="text-base font-semibold text-slate-900">{title}</h3>}
          {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
    );
  }
  return <div className={`p-5 pb-3 border-b border-slate-100 ${className}`}>{children}</div>;
};

export const CardContent = ({ children, className = '' }) => {
  return <div className={`p-5 ${className}`}>{children}</div>;
};

export const CardFooter = ({ children, className = '' }) => {
  return (
    <div className={`p-5 pt-3 border-t border-slate-100 bg-slate-50/50 rounded-b-xl flex items-center justify-between ${className}`}>
      {children}
    </div>
  );
};
