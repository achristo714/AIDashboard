import { useState, useCallback, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';
import { format, parseISO, startOfWeek } from 'date-fns';
import { formatNumber } from '../../utils/formatters';
import { useChartTheme } from '../../hooks/useChartTheme';
import { CHART_COLORS } from '../../constants/chartColors';
import type { GenerationRecord } from '../../types/generation';

interface Props {
  records: GenerationRecord[];
}

export default function ModelTrends({ records }: Props) {
  const theme = useChartTheme();
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  const toggle = useCallback((model: string) => {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(model)) next.delete(model);
      else next.add(model);
      return next;
    });
  }, []);

  // Get top models by request count
  const modelCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of records) {
      counts.set(r.modelName, (counts.get(r.modelName) || 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [records]);

  const topModels = useMemo(() => modelCounts.slice(0, 10).map(([name]) => name), [modelCounts]);

  // Aggregate by week + model
  const chartData = useMemo(() => {
    const weekModel = new Map<string, Record<string, number>>();

    for (const r of records) {
      if (!topModels.includes(r.modelName)) continue;
      const week = format(startOfWeek(parseISO(r.time), { weekStartsOn: 1 }), 'yyyy-MM-dd');
      if (!weekModel.has(week)) {
        weekModel.set(week, {});
      }
      const bucket = weekModel.get(week)!;
      bucket[r.modelName] = (bucket[r.modelName] || 0) + 1;
    }

    return [...weekModel.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, models]) => ({
        label: format(parseISO(week), 'MMM d'),
        ...models,
      }));
  }, [records, topModels]);

  if (chartData.length === 0) {
    return <div className="h-80 flex items-center justify-center text-gray-400">No data available</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={380}>
      <LineChart data={chartData} margin={{ left: 10, right: 10, top: 5, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.gridColor} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: theme.tickColor }} interval="preserveStartEnd" />
        <YAxis tickFormatter={(v) => formatNumber(v)} tick={{ fill: theme.tickColor }} />
        <Tooltip
          contentStyle={theme.tooltipStyle}
          labelStyle={theme.tooltipLabelStyle}
          itemStyle={theme.tooltipItemStyle}
          formatter={(value, name) => [formatNumber(Number(value)) + ' requests', name]}
        />
        <Legend
          onClick={(e) => {
            if (e && e.dataKey) toggle(String(e.dataKey));
          }}
          formatter={(value: string) => {
            const isHidden = hidden.has(value);
            const idx = topModels.indexOf(value);
            return (
              <span className="text-xs cursor-pointer select-none" style={{
                color: isHidden ? '#6b7280' : CHART_COLORS[idx % CHART_COLORS.length],
                textDecoration: isHidden ? 'line-through' : 'none',
              }}>
                {value}
              </span>
            );
          }}
        />
        {topModels.map((model, idx) => (
          <Line
            key={model}
            type="monotone"
            dataKey={model}
            stroke={CHART_COLORS[idx % CHART_COLORS.length]}
            strokeWidth={2}
            dot={false}
            connectNulls
            hide={hidden.has(model)}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
