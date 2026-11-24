import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const Toast = ({ id, type = 'info', message, title, onClose }) => {
  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />,
    info: <Info className="w-5 h-5 text-sky-500 shrink-0" />
  };

  const borders = {
    success: 'border-emerald-200 bg-white',
    error: 'border-rose-200 bg-white',
    info: 'border-sky-200 bg-white'
  };

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg max-w-sm w-full transition-all duration-200 ${borders[type] || borders.info}`}
    >
      {icons[type]}
      <div className="flex-1 min-w-0">
        {title && <h4 className="text-sm font-semibold text-slate-900 mb-0.5">{title}</h4>}
        <p className="text-xs text-slate-600 break-words">{message}</p>
      </div>
      <button
        onClick={() => onClose(id)}
        className="text-slate-400 hover:text-slate-600 rounded-md p-1 -mr-1 -mt-1"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
