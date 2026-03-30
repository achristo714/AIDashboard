import { useMemo, useState } from 'react';
import { useGenerationStore } from '../store/generationStore';
import { projectMonth } from '../utils/projections';
import { aggregateByTime } from '../utils/aggregations';
import { formatNumber, formatCredits } from '../utils/formatters';
import ProjectionGauge from '../components/charts/ProjectionGauge';
import CumulativeArea from '../components/charts/CumulativeArea';
import { format, subMonths } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function ProjectionsPage() {
  const { records, targets } = useGenerationStore();
  const [selectedMonth] = useState(new Date());

  const monthlyTarget = targets.find((t) => t.period === 'monthly' && !t.email);
  const projection = useMemo(
    () => projectMonth(records, selectedMonth, monthlyTarget?.amount ?? null),
    [records, selectedMonth, monthlyTarget]
  );

  // Month-over-month data
  const monthlyData = useMemo(() => {
    const monthly = aggregateByTime(records, 'monthly');
    return monthly.map((m) => ({
      ...m,
      target: monthlyTarget?.amount || null,
    }));
  }, [records, monthlyTarget]);

  // Previous month comparison
  const prevMonth = subMonths(selectedMonth, 1);
  const prevProjection = useMemo(
    () => projectMonth(records, prevMonth, monthlyTarget?.amount ?? null),
    [records, prevMonth, monthlyTarget]
  );

  const momChange = prevProjection.currentTotal > 0
    ? ((projection.currentTotal - prevProjection.currentTotal) / prevProjection.currentTotal) * 100
    : 0;

  if (records.length === 0) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-gray-400">
        Upload data to see projections
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Projections</h2>

      {/* Status cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <p className="text-sm text-gray-500">Current Month Spend</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{formatCredits(projection.currentTotal)}</p>
          <p className="text-xs text-gray-400 mt-1">Day {projection.daysElapsed} of {projection.daysInMonth}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <p className="text-sm text-gray-500">Projected Month Total</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">{formatCredits(projection.projectedMonthTotal)}</p>
          <p className="text-xs text-gray-400 mt-1">Blended regression + moving avg</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <p className="text-sm text-gray-500">Daily Burn Rate</p>
          <p className="text-2xl font-bold text-amber-500 mt-1">{formatCredits(projection.burnRate)}</p>
          <p className="text-xs text-gray-400 mt-1">credits / day</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <p className="text-sm text-gray-500">Month-over-Month</p>
          <p className={`text-2xl font-bold mt-1 ${momChange >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
            {momChange >= 0 ? '+' : ''}{momChange.toFixed(1)}%
          </p>
          <p className="text-xs text-gray-400 mt-1">vs {format(prevMonth, 'MMM yyyy')}</p>
        </div>
      </div>

      {/* Budget info */}
      {monthlyTarget && projection.daysUntilBudgetExhausted !== null && (
        <div className={`rounded-xl border p-4 ${
          projection.daysUntilBudgetExhausted <= 5
            ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-700'
            : 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-700'
        }`}>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
            {projection.daysUntilBudgetExhausted === 0
              ? 'Budget already exceeded!'
              : `At current rate, budget will be exhausted in ~${projection.daysUntilBudgetExhausted} days`
            }
          </p>
        </div>
      )}

      {/* Gauge and cumulative */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Target Status</h3>
          <ProjectionGauge projection={projection} />
        </div>
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Cumulative Spend - {format(selectedMonth, 'MMMM yyyy')}
          </h3>
          <CumulativeArea projection={projection} />
        </div>
      </div>

      {/* Monthly comparison */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Monthly Credit Usage</h3>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={monthlyData} margin={{ left: 10, right: 10, top: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={(v) => formatNumber(v)} />
            <Tooltip
              formatter={(value, name) => [
                formatNumber(Number(value)),
                name === 'totalCredits' ? 'Credits' : 'Target',
              ]}
              contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
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
            <p className="text-lg font-semibold text-gray-900 dark:text-white">{formatCredits(projection.regressionProjection)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Moving Average</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">{formatCredits(projection.movingAvgProjection)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Blended Projection</p>
            <p className="text-lg font-semibold text-indigo-600">{formatCredits(projection.projectedMonthTotal)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
