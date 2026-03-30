import { useMemo, useState } from 'react';
import { useFilteredRecords } from '../hooks/useFilteredRecords';
import { aggregateByTime, aggregateByModel, aggregateByType, aggregateByHour } from '../utils/aggregations';
import { formatNumber } from '../utils/formatters';
import { useChartTheme } from '../hooks/useChartTheme';
import GenerationsPerDay from '../components/charts/GenerationsPerDay';
import CreditTrendLine from '../components/charts/CreditTrendLine';
import GranularityToggle from '../components/filters/GranularityToggle';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { CHART_COLORS } from '../constants/chartColors';
import type { TimeGranularity } from '../types/generation';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function GenerationsPage() {
  const records = useFilteredRecords();
  const [granularity, setGranularity] = useState<TimeGranularity>('daily');
  const theme = useChartTheme();

  const timeSeries = useMemo(() => aggregateByTime(records, granularity), [records, granularity]);
  const dailySeries = useMemo(() => aggregateByTime(records, 'daily'), [records]);
  const modelAgg = useMemo(() => aggregateByModel(records), [records]);
  const typeAgg = useMemo(() => aggregateByType(records), [records]);
  const hourlyAgg = useMemo(() => aggregateByHour(records), [records]);

  const totalGenerations = useMemo(() => records.reduce((s, r) => s + r.numberOfGenerations, 0), [records]);
  const avgPerDay = dailySeries.length > 0
    ? totalGenerations / dailySeries.length
    : 0;
  const avgPerRequest = records.length > 0
    ? totalGenerations / records.length
    : 0;

  // Build heatmap data
  const heatmapData = useMemo(() => {
    const grid: Record<string, number> = {};
    let max = 0;
    for (const h of hourlyAgg) {
      const key = `${h.dayOfWeek}-${h.hour}`;
      grid[key] = h.totalRequests;
      if (h.totalRequests > max) max = h.totalRequests;
    }
    return { grid, max };
  }, [hourlyAgg]);

  // Model bar chart data
  const modelGenData = modelAgg.map((m) => ({
    name: m.modelName,
    generations: m.totalGenerations,
    requests: m.totalRequests,
  }));

  const modelChartHeight = Math.max(300, modelGenData.length * 40);

  if (records.length === 0) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-gray-400">
        Upload data to see generation analytics
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Generations</h2>
        <GranularityToggle value={granularity} onChange={setGranularity} />
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <p className="text-sm text-gray-500">Total Generations</p>
          <p className="text-3xl font-bold text-amber-500 mt-1">{formatNumber(totalGenerations)}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <p className="text-sm text-gray-500">Avg Generations/Day</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{formatNumber(avgPerDay)}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <p className="text-sm text-gray-500">Avg Generations/Request</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{avgPerRequest.toFixed(2)}</p>
        </div>
      </div>

      {/* Generations over time */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Generations Over Time</h3>
        <GenerationsPerDay data={timeSeries} />
      </div>

      {/* Requests trend */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Requests Over Time</h3>
        <CreditTrendLine data={timeSeries} dataKey="totalRequests" color="#10b981" label="Requests" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By model */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Generations by Model</h3>
          <ResponsiveContainer width="100%" height={modelChartHeight}>
            <BarChart data={modelGenData} layout="vertical" margin={{ left: 20, right: 20, top: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.gridColor} />
              <XAxis type="number" tickFormatter={(v) => formatNumber(v)} tick={{ fill: theme.tickColor }} />
              <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 12, fill: theme.tickColor }} />
              <Tooltip formatter={(v) => [formatNumber(Number(v)), 'Generations']} contentStyle={theme.tooltipStyle} labelStyle={theme.tooltipLabelStyle} itemStyle={theme.tooltipItemStyle} />
              <Bar dataKey="generations" radius={[0, 6, 6, 0]}>
                {modelGenData.map((_, idx) => (
                  <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* By type */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Requests by Type</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={typeAgg.map((t) => ({ name: t.type.replace(/_/g, ' '), requests: t.totalRequests }))} margin={{ left: 10, right: 10, top: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.gridColor} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: theme.tickColor }} />
              <YAxis tickFormatter={(v) => formatNumber(v)} tick={{ fill: theme.tickColor }} />
              <Tooltip formatter={(v) => [formatNumber(Number(v)), 'Requests']} contentStyle={theme.tooltipStyle} labelStyle={theme.tooltipLabelStyle} itemStyle={theme.tooltipItemStyle} />
              <Bar dataKey="requests" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Peak hours heatmap */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Peak Activity Hours (UTC)</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="w-16"></th>
                {Array.from({ length: 24 }, (_, i) => (
                  <th key={i} className="text-xs text-gray-400 font-normal px-0.5 pb-1">{i}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DAYS.map((day, dow) => (
                <tr key={day}>
                  <td className="text-xs text-gray-500 pr-2 font-medium">{day}</td>
                  {Array.from({ length: 24 }, (_, hour) => {
                    const count = heatmapData.grid[`${dow}-${hour}`] || 0;
                    const intensity = heatmapData.max > 0 ? count / heatmapData.max : 0;
                    return (
                      <td key={hour} className="p-0.5">
                        <div
                          className="w-full aspect-square rounded-sm min-w-[16px]"
                          style={{
                            backgroundColor: intensity > 0
                              ? `rgba(99, 102, 241, ${0.1 + intensity * 0.85})`
                              : theme.heatmapEmpty,
                          }}
                          title={`${day} ${hour}:00 - ${count} requests`}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
