import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Line, ReferenceLine } from 'recharts';
import { formatNumber } from '../../utils/formatters';
import { useChartTheme } from '../../hooks/useChartTheme';
import type { ProjectionResult } from '../../utils/projections';

interface Props {
  projection: ProjectionResult;
}

export default function CumulativeArea({ projection }: Props) {
  const theme = useChartTheme();
  const { cumulativeData, targetAmount } = projection;

  if (cumulativeData.length === 0) {
    return <div className="h-80 flex items-center justify-center text-gray-400">No data available</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={360}>
      <AreaChart data={cumulativeData} margin={{ left: 10, right: 10, top: 5, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.gridColor} />
        <XAxis dataKey="day" label={{ value: 'Day of Month', position: 'insideBottom', offset: -5, fill: theme.tickColor }} tick={{ fill: theme.tickColor }} />
        <YAxis tickFormatter={(v) => formatNumber(v)} tick={{ fill: theme.tickColor }} />
        <Tooltip
          formatter={(value, name) => {
            const labels: Record<string, string> = { actual: 'Actual', projected: 'Projected', target: 'Target' };
            return [formatNumber(Number(value)), labels[String(name)] || name];
          }}
          contentStyle={theme.tooltipStyle}
        />
        <Area
          type="monotone"
          dataKey="actual"
          stroke="#6366f1"
          fill="#6366f1"
          fillOpacity={0.15}
          strokeWidth={2}
          connectNulls={false}
        />
        <Area
          type="monotone"
          dataKey="projected"
          stroke="#6366f1"
          fill="#6366f1"
          fillOpacity={0.05}
          strokeWidth={2}
          strokeDasharray="6 4"
          connectNulls={false}
        />
        {targetAmount && (
          <Line
            type="monotone"
            dataKey="target"
            stroke="#ef4444"
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={false}
          />
        )}
        {targetAmount && (
          <ReferenceLine
            y={targetAmount}
            stroke="#ef4444"
            strokeDasharray="4 4"
            label={{ value: 'Target', position: 'right', fill: '#ef4444', fontSize: 12 }}
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
}
