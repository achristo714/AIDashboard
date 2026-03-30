import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { formatNumber } from '../../utils/formatters';
import { useChartTheme } from '../../hooks/useChartTheme';
import type { RangeProjectionResult } from '../../utils/projections';

interface Props {
  data: RangeProjectionResult['cumulativeData'];
}

export default function CumulativeRangeChart({ data }: Props) {
  const theme = useChartTheme();

  if (data.length === 0) {
    return <div className="h-80 flex items-center justify-center text-gray-400">No data available</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={360}>
      <AreaChart data={data} margin={{ left: 10, right: 10, top: 5, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.gridColor} />
        <XAxis dataKey="label" tick={{ fontSize: 10, fill: theme.tickColor }} interval="preserveStartEnd" />
        <YAxis tickFormatter={(v) => formatNumber(v)} tick={{ fill: theme.tickColor }} />
        <Tooltip
          formatter={(value) => [formatNumber(Number(value)), 'Cumulative Credits']}
          contentStyle={theme.tooltipStyle}
          labelStyle={theme.tooltipLabelStyle}
          itemStyle={theme.tooltipItemStyle}
        />
        <Area
          type="monotone"
          dataKey="actual"
          stroke="#6366f1"
          fill="#6366f1"
          fillOpacity={0.15}
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
