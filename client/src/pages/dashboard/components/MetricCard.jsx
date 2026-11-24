import React from 'react';
import { Card } from '../../../components/ui/index.js';

export const MetricCard = ({
  title,
  value,
  subtitle,
  badge,
  icon: Icon,
  trendColor = 'text-slate-600',
  iconBg = 'bg-slate-100 text-slate-600'
}) => {
  return (
    <Card className="p-5 relative overflow-hidden transition-all hover:border-slate-300">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
        {Icon && (
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold text-slate-900 tracking-tight">{value}</span>
        {badge && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${trendColor}`}>
            {badge}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-1 text-xs text-slate-400 font-medium truncate">{subtitle}</p>
      )}
    </Card>
  );
};
