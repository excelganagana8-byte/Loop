import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';
import { Card, CardHeader, CardContent } from '../../../components/ui/index.js';

const COLORS = {
  POSITIVE: '#10b981', // emerald-500
  NEGATIVE: '#f43f5e', // rose-500
  NEUTRAL: '#64748b',  // slate-500
  UNKNOWN: '#cbd5e1',  // slate-300
};

export const SentimentChart = ({ data = [] }) => {
  const chartData = data.filter((d) => d.count > 0);

  if (!chartData || chartData.length === 0) {
    return (
      <Card className="h-80 flex flex-col justify-center items-center text-center p-6 text-slate-400">
        <p className="text-sm">No sentiment data available</p>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title="Sentiment Breakdown"
        description="Overall distribution of customer sentiment."
      />
      <CardContent className="h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={3}
              dataKey="count"
              nameKey="name"
            >
              {chartData.map((entry) => (
                <Cell key={entry.name} fill={COLORS[entry.name] || '#94a3b8'} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [`${value} items`, name]}
              contentStyle={{
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                fontSize: '12px'
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              wrapperStyle={{ fontSize: '12px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
