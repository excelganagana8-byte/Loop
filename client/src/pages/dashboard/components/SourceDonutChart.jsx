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

const SOURCE_COLORS = ['#6366f1', '#06b6d4', '#f59e0b', '#10b981', '#8b5cf6', '#64748b'];

export const SourceDonutChart = ({ data = [] }) => {
  const chartData = data.filter((d) => d.count > 0);

  if (!chartData || chartData.length === 0) {
    return (
      <Card className="h-80 flex flex-col justify-center items-center text-center p-6 text-slate-400">
        <p className="text-sm">No source channel data available</p>
      </Card>
    );
  }

  const formattedData = chartData.map((d) => ({
    ...d,
    displayName: d.name.replace(/_/g, ' ')
  }));

  return (
    <Card>
      <CardHeader
        title="Feedback by Channel"
        description="Origin source breakdown of customer feedback."
      />
      <CardContent className="h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={formattedData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={3}
              dataKey="count"
              nameKey="displayName"
            >
              {formattedData.map((entry, index) => (
                <Cell key={entry.name} fill={SOURCE_COLORS[index % SOURCE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(val, name, props) => [`${val} (${props.payload.percentage}%)`, name]}
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
              wrapperStyle={{ fontSize: '11px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
