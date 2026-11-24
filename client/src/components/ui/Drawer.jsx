import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export const Drawer = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-xl'
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex">
        <div
          className={`w-screen ${maxWidth} bg-white shadow-2xl flex flex-col border-l border-slate-200 transform transition ease-in-out duration-300`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-200/80 flex items-start justify-between bg-white shrink-0">
            <div>
              {title && <h2 className="text-lg font-semibold text-slate-900">{title}</h2>}
              {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
