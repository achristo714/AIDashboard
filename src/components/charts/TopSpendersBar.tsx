import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { CHART_COLORS } from '../../constants/chartColors';
import { truncateEmail, formatNumber } from '../../utils/formatters';
import { useChartTheme } from '../../hooks/useChartTheme';
import type { UserAggregation } from '../../utils/aggregations';

interface Props {
  data: UserAggregation[];
  limit?: number;
}

export default function TopSpendersBar({ data, limit = 15 }: Props) {
  const theme = useChartTheme();
  const chartData = data.slice(0, limit).map((u) => ({
    email: truncateEmail(u.email, 20),
    fullEmail: u.email,
    credits: u.totalCredits,
  }));

  if (chartData.length === 0) {
    return <div className="h-80 flex items-center justify-center text-gray-400">No data available</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={Math.min(550, Math.max(300, chartData.length * 36))}>
      <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20, top: 5, bottom: 5 }}>
        <XAxis type="number" tickFormatter={(v) => formatNumber(v)} tick={{ fill: theme.tickColor }} />
        <YAxis
          type="category"
          dataKey="email"
          width={160}
          tick={{ fontSize: 12, fill: theme.tickColor }}
        />
        <Tooltip
          formatter={(value) => [formatNumber(Number(value)) + ' credits', 'Credits']}
          labelFormatter={(label) => {
            const item = chartData.find((d) => d.email === label);
            return item?.fullEmail || label;
          }}
          contentStyle={theme.tooltipStyle}
          labelStyle={theme.tooltipLabelStyle}
          itemStyle={theme.tooltipItemStyle}
        />
        <Bar dataKey="credits" radius={[0, 6, 6, 0]}>
          {chartData.map((_, idx) => (
            <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
