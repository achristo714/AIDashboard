import {
  ComposedChart, Line, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';
import { formatNumber } from '../../utils/formatters';
import { useChartTheme } from '../../hooks/useChartTheme';
import type { TimeSeriesPoint } from '../../utils/aggregations';

interface Props {
  trendData: TimeSeriesPoint[];
  dailyData: TimeSeriesPoint[];
}

export default function CreditDualChart({ trendData, dailyData }: Props) {
  const theme = useChartTheme();

  // Merge daily data into the trend data by label
  // If granularity is 'daily', they're the same — show bar + line overlay
  // If weekly/monthly, show the aggregated trend line + daily bars underneath
  const isDailyGranularity = trendData.length === dailyData.length
    && trendData.length > 0
    && trendData[0].label === dailyData[0].label;

  // For daily granularity: single dataset with bar (daily) + line (same data, for clarity)
  // For weekly/monthly: use daily bars with trend line overlay
  const merged = isDailyGranularity
    ? trendData.map((t) => ({
        label: t.label,
        dailyCredits: t.totalCredits,
        trendCredits: t.totalCredits,
      }))
    : (() => {
        // Build a map of trend labels to their values
        const trendMap = new Map(trendData.map((t) => [t.label, t.totalCredits]));
        // Use daily data as base, overlay trend where labels match
        const dailyPoints = dailyData.map((d) => ({
          label: d.label,
          dailyCredits: d.totalCredits,
          trendCredits: undefined as number | undefined,
        }));
        // Add trend points at their label positions
        for (const point of dailyPoints) {
          if (trendMap.has(point.label)) {
            point.trendCredits = trendMap.get(point.label);
          }
        }
        return dailyPoints;
      })();

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
              trendCredits: 'Trend',
            };
            return [formatNumber(Number(value)), labels[String(name)] || name];
          }}
        />
        <Legend
          formatter={(value: string) => {
            const labels: Record<string, string> = {
              dailyCredits: 'Daily Spend',
              trendCredits: 'Trend',
            };
            return <span className="text-xs text-gray-600 dark:text-gray-300">{labels[value] || value}</span>;
          }}
        />
        <Bar dataKey="dailyCredits" fill="#f59e0b" fillOpacity={0.5} radius={[2, 2, 0, 0]} />
        {!isDailyGranularity && (
          <Line
            type="monotone"
            dataKey="trendCredits"
            stroke="#6366f1"
            strokeWidth={2.5}
            dot={false}
            connectNulls
          />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
}
