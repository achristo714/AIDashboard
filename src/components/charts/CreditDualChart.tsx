import { useState, useCallback } from 'react';
import {
  ComposedChart, Line, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';
import { formatNumber } from '../../utils/formatters';
import { useChartTheme } from '../../hooks/useChartTheme';
import type { TimeSeriesPoint } from '../../utils/aggregations';

interface Props {
  dailyData: TimeSeriesPoint[];
}

function computeMovingAverage(data: number[], window: number): (number | null)[] {
  const result: (number | null)[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < window - 1) {
      result.push(null);
    } else {
      let sum = 0;
      for (let j = i - window + 1; j <= i; j++) {
        sum += data[j];
      }
      result.push(sum / window);
    }
  }
  return result;
}

const SERIES_LABELS: Record<string, string> = {
  dailyCredits: 'Daily Spend',
  movingAvg: '7-Day Avg (Credits)',
  requests: 'Requests',
  requestsAvg: '7-Day Avg (Requests)',
};

const SERIES_COLORS: Record<string, string> = {
  dailyCredits: '#f59e0b',
  movingAvg: '#6366f1',
  requests: '#10b981',
  requestsAvg: '#14b8a6',
};

export default function CreditDualChart({ dailyData }: Props) {
  const theme = useChartTheme();
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  const toggleSeries = useCallback((dataKey: string) => {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(dataKey)) next.delete(dataKey);
      else next.add(dataKey);
      return next;
    });
  }, []);

  const creditsMa = computeMovingAverage(dailyData.map((d) => d.totalCredits), 7);
  const requestsMa = computeMovingAverage(dailyData.map((d) => d.totalRequests), 7);

  const merged = dailyData.map((d, i) => ({
    label: d.label,
    dailyCredits: d.totalCredits,
    movingAvg: creditsMa[i],
    requests: d.totalRequests,
    requestsAvg: requestsMa[i],
  }));

  if (merged.length === 0) {
    return <div className="h-80 flex items-center justify-center text-gray-400">No data available</div>;
  }

  const showRequests = !hidden.has('requests') || !hidden.has('requestsAvg');

  return (
    <ResponsiveContainer width="100%" height={320}>
      <ComposedChart data={merged} margin={{ left: 10, right: showRequests ? 10 : 0, top: 5, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.gridColor} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: theme.tickColor }}
          interval="preserveStartEnd"
        />
        <YAxis yAxisId="credits" tickFormatter={(v) => formatNumber(v)} tick={{ fill: theme.tickColor }} />
        {showRequests && (
          <YAxis yAxisId="requests" orientation="right" tickFormatter={(v) => formatNumber(v)} tick={{ fill: '#10b981' }} />
        )}
        <Tooltip
          contentStyle={theme.tooltipStyle}
          labelStyle={theme.tooltipLabelStyle}
          itemStyle={theme.tooltipItemStyle}
          formatter={(value, name) => [formatNumber(Number(value)), SERIES_LABELS[String(name)] || name]}
        />
        <Legend
          onClick={(e) => {
            if (e && e.dataKey) toggleSeries(String(e.dataKey));
          }}
          formatter={(value: string) => {
            const isHidden = hidden.has(value);
            return (
              <span className="text-xs cursor-pointer select-none" style={{
                color: isHidden ? '#6b7280' : SERIES_COLORS[value] || '#9ca3af',
                textDecoration: isHidden ? 'line-through' : 'none',
              }}>
                {SERIES_LABELS[value] || value}
              </span>
            );
          }}
        />
        {!hidden.has('dailyCredits') && (
          <Bar yAxisId="credits" dataKey="dailyCredits" fill="#f59e0b" fillOpacity={0.5} radius={[2, 2, 0, 0]} />
        )}
        {!hidden.has('movingAvg') && (
          <Line yAxisId="credits" type="monotone" dataKey="movingAvg" stroke="#6366f1" strokeWidth={2.5} dot={false} connectNulls />
        )}
        {!hidden.has('requests') && (
          <Line yAxisId="requests" type="monotone" dataKey="requests" stroke="#10b981" strokeWidth={1} dot={false} strokeOpacity={0.4} />
        )}
        {!hidden.has('requestsAvg') && (
          <Line yAxisId="requests" type="monotone" dataKey="requestsAvg" stroke="#14b8a6" strokeWidth={2} dot={false} connectNulls />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
}
