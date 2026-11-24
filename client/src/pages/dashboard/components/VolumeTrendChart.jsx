import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { Card, CardHeader, CardContent } from '../../../components/ui/index.js';

export const VolumeTrendChart = ({ data = [] }) => {
  if (!data || data.length === 0) {
    return (
      <Card className="h-80 flex flex-col justify-center items-center text-center p-6 text-slate-400">
        <p className="text-sm">No trend data available for this range</p>
      </Card>
    );
  }

  // Format date display (e.g. 2026-01-15 -> Jan 15)
  const formattedData = data.map((d) => {
    const parts = d.date.split('-');
    const label = parts.length === 3 ? `${parts[1]}/${parts[2]}` : d.date;
    return {
      ...d,
      displayDate: label
    };
  });

  return (
    <Card>
      <CardHeader
        title="Feedback Volume & Sentiment Over Time"
        description="Daily trend of incoming customer feedback split by sentiment."
      />
      <CardContent className="h-72 w-full pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPositive" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorNegative" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorNeutral" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="displayDate" stroke="#94a3b8" fontSize={11} tickLine={false} />
            <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                fontSize: '12px'
              }}
            />
            <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
            <Area
              type="monotone"
              dataKey="positive"
              name="Positive"
              stroke="#10b981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorPositive)"
            />
            <Area
              type="monotone"
              dataKey="negative"
              name="Negative"
              stroke="#f43f5e"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorNegative)"
            />
            <Area
              type="monotone"
              dataKey="neutral"
              name="Neutral"
              stroke="#6366f1"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorNeutral)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
