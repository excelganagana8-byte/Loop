import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Card, CardHeader, CardContent } from '../../../components/ui/index.js';

const CATEGORY_COLORS = {
  BUG: '#f43f5e',
  FEATURE_REQUEST: '#6366f1',
  PRICING: '#f59e0b',
  USABILITY: '#3b82f6',
  CUSTOMER_SUPPORT: '#8b5cf6',
  PERFORMANCE: '#ea580c',
  PRAISE: '#10b981',
  OTHER: '#64748b'
};

export const CategoryChart = ({ data = [] }) => {
  if (!data || data.length === 0) {
    return (
      <Card className="h-80 flex flex-col justify-center items-center text-center p-6 text-slate-400">
        <p className="text-sm">No category distribution data available</p>
      </Card>
    );
  }

  const formattedData = data.map((d) => ({
    ...d,
    displayName: d.name.replace(/_/g, ' ')
  }));

  return (
    <Card>
      <CardHeader
        title="Category Distribution"
        description="Volume split by AI-classified feedback category."
      />
      <CardContent className="h-72 w-full pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={formattedData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
            <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
            <YAxis
              type="category"
              dataKey="displayName"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              width={100}
            />
            <Tooltip
              formatter={(val, name, props) => [`${val} (${props.payload.percentage}%)`, 'Volume']}
              contentStyle={{
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                fontSize: '12px'
              }}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {formattedData.map((entry) => (
                <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] || '#6366f1'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
