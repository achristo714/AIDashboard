import { useMemo, useState } from 'react';
import { Coins, ImageIcon, Zap, Users, AlertTriangle, Crown, Clock, TrendingUp } from 'lucide-react';
import { useGenerationStore } from '../store/generationStore';
import { useFilteredRecords } from '../hooks/useFilteredRecords';
import { aggregateByTime, aggregateByUser, aggregateByModel, aggregateByType } from '../utils/aggregations';
import { projectMonth } from '../utils/projections';
import { formatNumber, formatCredits } from '../utils/formatters';
import KpiCard from '../components/cards/KpiCard';
import TopSpendersBar from '../components/charts/TopSpendersBar';
import CreditTrendLine from '../components/charts/CreditTrendLine';
import GenerationsPerDay from '../components/charts/GenerationsPerDay';
import ModelBreakdown from '../components/charts/ModelBreakdown';
import TypeBreakdown from '../components/charts/TypeBreakdown';
import ProjectionGauge from '../components/charts/ProjectionGauge';
import CumulativeArea from '../components/charts/CumulativeArea';
import ChartHeader from '../components/cards/ChartHeader';
import GranularityToggle from '../components/filters/GranularityToggle';
import type { TimeGranularity } from '../types/generation';

export default function DashboardPage() {
  const { anomalies, targets } = useGenerationStore();
  const records = useFilteredRecords();
  const [granularity, setGranularity] = useState<TimeGranularity>('daily');

  const timeSeries = useMemo(() => aggregateByTime(records, granularity), [records, granularity]);
  const userAgg = useMemo(() => aggregateByUser(records), [records]);
  const modelAgg = useMemo(() => aggregateByModel(records), [records]);
  const typeAgg = useMemo(() => aggregateByType(records), [records]);
  const dailySeries = useMemo(() => aggregateByTime(records, 'daily'), [records]);

  const totalCredits = useMemo(() => records.reduce((sum, r) => sum + r.credits, 0), [records]);
  const totalGenerations = useMemo(() => records.reduce((sum, r) => sum + r.numberOfGenerations, 0), [records]);
  const uniqueUsers = useMemo(() => new Set(records.map((r) => r.email)).size, [records]);
  const activeAnomalies = useMemo(() => anomalies.filter((a) => !a.dismissed).length, [anomalies]);
  const topSpender = userAgg[0];

  const monthlyTarget = targets.find((t) => t.period === 'monthly' && !t.email);
  const projection = useMemo(
    () => projectMonth(records, new Date(), monthlyTarget?.amount ?? null),
    [records, monthlyTarget]
  );

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-4">
          <Coins size={36} className="text-indigo-400" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Data Yet</h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-md">
          Upload your xfigura CSV export to see your generation analytics, spending trends, and projections.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h2>
        <GranularityToggle value={granularity} onChange={setGranularity} />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard
          title="Total Credits"
          value={formatCredits(totalCredits)}
          subtitle={`${formatNumber(records.length)} requests`}
          icon={<Coins size={20} />}
          tooltip="Sum of all credits consumed across all generation requests in the selected date range."
          color="indigo"
        />
        <KpiCard
          title="Images Generated"
          value={formatNumber(totalGenerations)}
          icon={<ImageIcon size={20} />}
          tooltip="Total number of images/outputs generated, from the 'Number of Generations' column in your CSV."
          color="amber"
        />
        <KpiCard
          title="Total Requests"
          value={formatNumber(records.length)}
          icon={<Zap size={20} />}
          tooltip="Total number of API requests (rows in the CSV). One request can produce multiple generations."
          color="emerald"
        />
        <KpiCard
          title="Active Users"
          value={formatNumber(uniqueUsers)}
          icon={<Users size={20} />}
          tooltip="Count of unique email addresses that made at least one request in the selected date range."
          color="cyan"
        />
        <KpiCard
          title="Anomalies"
          value={formatNumber(activeAnomalies)}
          icon={<AlertTriangle size={20} />}
          tooltip="Flagged issues: duplicates, credit outliers, usage spikes, missing data, or suspicious patterns. Review on the Anomalies page."
          color="red"
        />
        <KpiCard
          title="Top Spender"
          value={topSpender ? formatCredits(topSpender.totalCredits) : '--'}
          subtitle={topSpender?.email || 'No data'}
          icon={<Crown size={20} />}
          tooltip="The user who consumed the most credits in the selected date range."
          color="violet"
        />
      </div>

      {/* Projection Alert Banner */}
      {monthlyTarget && projection.daysUntilBudgetExhausted !== null && (
        <div className={`rounded-xl border p-4 flex items-center gap-3 ${
          projection.daysUntilBudgetExhausted === 0
            ? 'bg-red-500/10 border-red-500/30 text-red-400'
            : projection.daysUntilBudgetExhausted <= 7
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
        }`}>
          <Clock size={20} />
          <div>
            <p className="font-semibold text-sm">
              {projection.daysUntilBudgetExhausted === 0
                ? 'Budget exhausted! Current spend has exceeded the monthly target.'
                : `At current burn rate (${formatCredits(projection.burnRate)}/day), budget will be exhausted in ~${projection.daysUntilBudgetExhausted} days`
              }
            </p>
            <p className="text-xs mt-0.5 opacity-75">
              {formatCredits(projection.currentTotal)} of {formatCredits(monthlyTarget.amount)} credits used
              {' '}&middot; Day {projection.daysElapsed} of {projection.daysInMonth}
              {' '}&middot; Projected total: {formatCredits(projection.projectedMonthTotal)}
            </p>
          </div>
        </div>
      )}

      {!monthlyTarget && (
        <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-4 flex items-center gap-3 text-indigo-400">
          <TrendingUp size={20} />
          <div>
            <p className="font-semibold text-sm">
              Daily burn rate: {formatCredits(projection.burnRate)} credits/day &middot; Projected month total: {formatCredits(projection.projectedMonthTotal)}
            </p>
            <p className="text-xs mt-0.5 opacity-75">
              Set a monthly target in Settings to track budget exhaustion
            </p>
          </div>
        </div>
      )}

      {/* Main charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <ChartHeader title="Credit Usage Trend" tooltip="Total credits consumed over time. Use the Daily/Weekly/Monthly toggle to change granularity. Affected by the date range filter." />
          <CreditTrendLine data={timeSeries} />
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <ChartHeader title="Monthly Projection" tooltip="Estimates end-of-month credit usage using a blend of linear regression (60%) and moving average (40%). Set a target in Settings to see on-track status." />
          <ProjectionGauge projection={projection} />
        </div>
      </div>

      {/* Cumulative projection chart */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <ChartHeader title="Cumulative Month Spend vs Target" tooltip="Solid line = actual cumulative spend so far. Dashed line = projected spend for remaining days. Red dashed line = your monthly target (if set)." />
        <CumulativeArea projection={projection} />
      </div>

      {/* Second row - Top Spenders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <ChartHeader title="Top Spenders" tooltip="Top 10 users ranked by total credits consumed in the selected date range." />
          <TopSpendersBar data={userAgg} />
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <ChartHeader title="Spender Leaderboard" tooltip="Quick-view ranked list of top users. Click 'Top Spenders' in the sidebar for full details and drill-down." />
          <div className="space-y-2">
            {userAgg.slice(0, 10).map((user, idx) => (
              <div key={user.email} className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                  idx === 0 ? 'bg-amber-500' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-amber-700' : 'bg-gray-600'
                }`}>
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.email}</p>
                  <p className="text-xs text-gray-400">{formatNumber(user.totalRequests)} requests</p>
                </div>
                <span className="text-sm font-semibold text-indigo-500">{formatCredits(user.totalCredits)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Generations row */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <ChartHeader title="Images Generated Per Day" tooltip="Daily count of images/outputs produced, from the 'Number of Generations' column. Shows generation volume independent of credit cost." />
        <GenerationsPerDay data={dailySeries} />
      </div>

      {/* Model & Type breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <ChartHeader title="Usage by Model" tooltip="Credit consumption broken down by AI model (Nano Banana, Clarity Upscaler, Runway, etc.). Shows which models cost the most." />
          <ModelBreakdown data={modelAgg} />
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <ChartHeader title="Usage by Type" tooltip="Credit consumption by generation type: image-to-image, image upscale, image-to-video, etc." />
          <TypeBreakdown data={typeAgg} />
        </div>
      </div>
    </div>
  );
}
