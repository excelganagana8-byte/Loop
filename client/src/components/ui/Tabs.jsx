import React from 'react';

export const Tabs = ({ tabs = [], activeTab, onChange, className = '' }) => {
  return (
    <div className={`border-b border-slate-200 ${className}`}>
      <nav className="-mb-px flex space-x-6" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`group inline-flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                isActive
                  ? 'border-brand-600 text-brand-600 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              {Icon && (
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-brand-600' : 'text-slate-400 group-hover:text-slate-500'
                  }`}
                />
              )}
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={`ml-1 rounded-full px-2 py-0.5 text-xs ${
                    isActive ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
