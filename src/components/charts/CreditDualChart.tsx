import {
  ComposedChart, Line, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';
import { formatNumber } from '../../utils/formatters';
import { useChartTheme } from '../../hooks/useChartTheme';
import type { TimeSeriesPoint } from '../../utils/aggregations';

interface Props {
  dailyData: TimeSeriesPoint[];
}

function computeMovingAverage(data: { value: number }[], window: number): (number | null)[] {
  const result: (number | null)[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < window - 1) {
      result.push(null);
    } else {
      let sum = 0;
      for (let j = i - window + 1; j <= i; j++) {
        sum += data[j].value;
      }
      result.push(sum / window);
    }
  }
  return result;
}

export default function CreditDualChart({ dailyData }: Props) {
  const theme = useChartTheme();

  const ma = computeMovingAverage(
    dailyData.map((d) => ({ value: d.totalCredits })),
    7
  );

  const merged = dailyData.map((d, i) => ({
    label: d.label,
    dailyCredits: d.totalCredits,
    movingAvg: ma[i],
  }));

  if (merged.length === 0) {
    return <div className="h-80 flex items-center justify-center text-gray-400">No data available</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <ComposedChart data={merged} margin={{ left: 10, right: 10, top: 5, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.gridColor} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: theme.tickColor }}
          interval="preserveStartEnd"
        />
        <YAxis tickFormatter={(v) => formatNumber(v)} tick={{ fill: theme.tickColor }} />
        <Tooltip
          contentStyle={theme.tooltipStyle}
          labelStyle={theme.tooltipLabelStyle}
          itemStyle={theme.tooltipItemStyle}
          formatter={(value, name) => {
            const labels: Record<string, string> = {
              dailyCredits: 'Daily Spend',
              movingAvg: '7-Day Average',
            };
            return [formatNumber(Number(value)), labels[String(name)] || name];
          }}
        />
        <Legend
          formatter={(value: string) => {
            const labels: Record<string, string> = {
              dailyCredits: 'Daily Spend',
              movingAvg: '7-Day Average',
            };
            return <span className="text-xs text-gray-600 dark:text-gray-300">{labels[value] || value}</span>;
          }}
        />
        <Bar dataKey="dailyCredits" fill="#f59e0b" fillOpacity={0.5} radius={[2, 2, 0, 0]} />
        <Line
          type="monotone"
          dataKey="movingAvg"
          stroke="#6366f1"
          strokeWidth={2.5}
          dot={false}
          connectNulls
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
