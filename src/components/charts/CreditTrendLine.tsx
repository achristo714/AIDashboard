import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { formatNumber } from '../../utils/formatters';
import { useChartTheme } from '../../hooks/useChartTheme';
import type { TimeSeriesPoint } from '../../utils/aggregations';

interface Props {
  data: TimeSeriesPoint[];
  dataKey?: 'totalCredits' | 'totalGenerations' | 'totalRequests';
  color?: string;
  label?: string;
}

export default function CreditTrendLine({
  data,
  dataKey = 'totalCredits',
  color = '#6366f1',
  label = 'Credits',
}: Props) {
  const theme = useChartTheme();

  if (data.length === 0) {
    return <div className="h-80 flex items-center justify-center text-gray-400">No data available</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data} margin={{ left: 10, right: 10, top: 5, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.gridColor} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: theme.tickColor }}
          interval="preserveStartEnd"
        />
        <YAxis tickFormatter={(v) => formatNumber(v)} tick={{ fill: theme.tickColor }} />
        <Tooltip
          formatter={(value) => [formatNumber(Number(value)), label]}
          contentStyle={theme.tooltipStyle}
          labelStyle={theme.tooltipLabelStyle}
          itemStyle={theme.tooltipItemStyle}
        />
        <Line
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
