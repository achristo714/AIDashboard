import { useMemo } from 'react';
import { useGenerationStore } from '../store/generationStore';
import { useFilteredRecords } from '../hooks/useFilteredRecords';
import { projectMonth, projectRange } from '../utils/projections';
import { aggregateByTime } from '../utils/aggregations';
import CreditTrendLine from '../components/charts/CreditTrendLine';
import { formatNumber, formatCredits } from '../utils/formatters';
import ProjectionGauge from '../components/charts/ProjectionGauge';
import CumulativeArea from '../components/charts/CumulativeArea';
import CumulativeRangeChart from '../components/charts/CumulativeRangeChart';
import { format, subMonths } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useChartTheme } from '../hooks/useChartTheme';

export default function ProjectionsPage() {
  const { targets, datePreset } = useGenerationStore();
  const records = useFilteredRecords();
  const theme = useChartTheme();

  const isMonthMode = datePreset === 'thisMonth' || datePreset === 'lastMonth';

  const monthlyTarget = targets.find((t) => t.period === 'monthly' && !t.email);

  // Month-based projection (for thisMonth / lastMonth)
  const targetMonth = datePreset === 'lastMonth' ? subMonths(new Date(), 1) : new Date();
  const monthProjection = useMemo(
    () => projectMonth(records, targetMonth, monthlyTarget?.amount ?? null),
    [records, targetMonth, monthlyTarget]
  );

  // Range-based projection (for all other presets)
  const rangeProjection = useMemo(
    () => projectRange(records, monthlyTarget?.amount ?? null),
    [records, monthlyTarget]
  );

  // Previous month comparison (month mode only)
  const prevMonth = subMonths(targetMonth, 1);
  const prevProjection = useMemo(
    () => projectMonth(records, prevMonth, monthlyTarget?.amount ?? null),
    [records, prevMonth, monthlyTarget]
  );
  const momChange = prevProjection.currentTotal > 0
    ? ((monthProjection.currentTotal - prevProjection.currentTotal) / prevProjection.currentTotal) * 100
    : 0;

  // Daily spend (non-cumulative)
  const dailySeries = useMemo(() => aggregateByTime(records, 'daily'), [records]);

  // Monthly comparison bar data (works for all modes)
  const monthlyData = useMemo(() => {
    const monthly = aggregateByTime(records, 'monthly');
    return monthly.map((m) => ({
      ...m,
      target: monthlyTarget?.amount || null,
    }));
  }, [records, monthlyTarget]);

  if (records.length === 0) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-gray-400">
        Upload data to see projections
      </div>
    );
  }

  // Choose which data to display
  const p = isMonthMode ? monthProjection : null;
  const rp = !isMonthMode ? rangeProjection : null;

  const title = isMonthMode
    ? `Cumulative Spend – ${format(targetMonth, 'MMMM yyyy')}`
    : `Cumulative Spend – ${rangeProjection.rangeLabel}`;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Projections</h2>

      {/* Status cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <p className="text-sm text-gray-500">{isMonthMode ? 'Current Month Spend' : 'Total Spend'}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {formatCredits(p ? p.currentTotal : rp!.currentTotal)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {p ? `Day ${p.daysElapsed} of ${p.daysInMonth}` : `${rp!.daysElapsed} days of data`}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <p className="text-sm text-gray-500">{isMonthMode ? 'Projected Month Total' : 'Projected Next 30 Days'}</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">
            {formatCredits(p ? p.projectedMonthTotal : rp!.projectedNext30Days)}
          </p>
          <p className="text-xs text-gray-400 mt-1">Blended regression + moving avg</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <p className="text-sm text-gray-500">Daily Burn Rate</p>
          <p className="text-2xl font-bold text-amber-500 mt-1">
            {formatCredits(p ? p.burnRate : rp!.burnRate)}
          </p>
          <p className="text-xs text-gray-400 mt-1">credits / day</p>
        </div>
        {isMonthMode ? (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <p className="text-sm text-gray-500">Month-over-Month</p>
            <p className={`text-2xl font-bold mt-1 ${momChange >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {momChange >= 0 ? '+' : ''}{momChange.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-400 mt-1">vs {format(prevMonth, 'MMM yyyy')}</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <p className="text-sm text-gray-500">Date Range</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">{rp!.daysElapsed} days</p>
            <p className="text-xs text-gray-400 mt-1">{rp!.rangeLabel}</p>
          </div>
        )}
      </div>

      {/* Budget info */}
      {monthlyTarget && (
        <div className={`rounded-xl border p-4 ${
          (p?.daysUntilBudgetExhausted ?? rp!.daysUntilBudgetExhausted ?? 999) <= 5
            ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-700'
            : 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-700'
        }`}>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
            {isMonthMode
              ? (p!.daysUntilBudgetExhausted === 0
                ? 'Budget already exceeded!'
                : `At current rate, budget will be exhausted in ~${p!.daysUntilBudgetExhausted} days`)
              : `At current burn rate of ${formatCredits(rp!.burnRate)}/day, a monthly budget of ${formatCredits(monthlyTarget.amount)} lasts ~${rp!.daysUntilBudgetExhausted} days`
            }
          </p>
        </div>
      )}

      {/* Gauge and cumulative */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {isMonthMode && (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Target Status</h3>
            <ProjectionGauge projection={monthProjection} />
          </div>
        )}
        <div className={`${isMonthMode ? 'lg:col-span-2' : 'lg:col-span-3'} bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5`}>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
          {isMonthMode ? (
            <CumulativeArea projection={monthProjection} />
          ) : (
            <CumulativeRangeChart data={rangeProjection.cumulativeData} />
          )}
        </div>
      </div>

      {/* Daily spend (non-cumulative) */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Daily Credit Spend</h3>
        <CreditTrendLine data={dailySeries} dataKey="totalCredits" color="#f59e0b" label="Credits" />
      </div>

      {/* Monthly comparison */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Monthly Credit Usage</h3>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={monthlyData} margin={{ left: 10, right: 10, top: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.gridColor} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: theme.tickColor }} />
            <YAxis tickFormatter={(v) => formatNumber(v)} tick={{ fill: theme.tickColor }} />
            <Tooltip
              formatter={(value, name) => [
                formatNumber(Number(value)),
                name === 'totalCredits' ? 'Credits' : 'Target',
              ]}
              contentStyle={theme.tooltipStyle}
              labelStyle={theme.tooltipLabelStyle}
              itemStyle={theme.tooltipItemStyle}
            />
            <Bar dataKey="totalCredits" fill="#6366f1" radius={[4, 4, 0, 0]} name="Credits" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Projection detail table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Projection Details</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Linear Regression</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {formatCredits(p ? p.regressionProjection : rp!.regressionProjection)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Moving Average</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {formatCredits(p ? p.movingAvgProjection : rp!.movingAvgProjection)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Blended {isMonthMode ? 'Month' : '30-Day'} Projection</p>
            <p className="text-lg font-semibold text-indigo-600">
              {formatCredits(p ? p.projectedMonthTotal : rp!.projectedNext30Days)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
