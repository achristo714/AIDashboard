import { useMemo } from 'react';
import { Coins, ImageIcon, Zap, Users, AlertTriangle, Crown, Clock, TrendingUp } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { CHART_COLORS } from '../constants/chartColors';
import { useGenerationStore } from '../store/generationStore';
import { useFilteredRecords } from '../hooks/useFilteredRecords';
import { aggregateByTime, aggregateByUser, aggregateByModel, aggregateByType } from '../utils/aggregations';
import { projectMonth, projectRange } from '../utils/projections';
import { formatNumber, formatCredits } from '../utils/formatters';
import KpiCard from '../components/cards/KpiCard';
import CreditDualChart from '../components/charts/CreditDualChart';
import GenerationsPerDay from '../components/charts/GenerationsPerDay';
import ModelBreakdown from '../components/charts/ModelBreakdown';
import ModelTrends from '../components/charts/ModelTrends';
import TypeBreakdown from '../components/charts/TypeBreakdown';
import ProjectionGauge from '../components/charts/ProjectionGauge';
import CumulativeArea from '../components/charts/CumulativeArea';
import CumulativeRangeChart from '../components/charts/CumulativeRangeChart';
import ChartHeader from '../components/cards/ChartHeader';

export default function DashboardPage() {
  const { anomalies, targets, datePreset } = useGenerationStore();
  const isMonthMode = datePreset === 'thisMonth' || datePreset === 'lastMonth';
  const records = useFilteredRecords();
  const userAgg = useMemo(() => aggregateByUser(records), [records]);
  const modelAgg = useMemo(() => aggregateByModel(records), [records]);
  const typeAgg = useMemo(() => aggregateByType(records), [records]);
  const dailySeries = useMemo(() => aggregateByTime(records, 'daily'), [records]);

  const totalCredits = useMemo(() => records.reduce((sum, r) => sum + r.credits, 0), [records]);
  const totalGenerations = useMemo(() => records.reduce((sum, r) => sum + r.numberOfGenerations, 0), [records]);
  const uniqueUsers = useMemo(() => new Set(records.map((r) => r.email)).size, [records]);
  const activeAnomalies = useMemo(() => anomalies.filter((a) => !a.dismissed).length, [anomalies]);
  const topSpender = userAgg[0];

  // User activity tiers based on generation rate in the filtered date range
  const { activeUsers, casualUsers } = useMemo(() => {
    if (records.length === 0) return { activeUsers: 0, casualUsers: 0 };

    // Determine weeks and months in the filtered range
    const times = records.map((r) => new Date(r.time).getTime());
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const spanMs = Math.max(maxTime - minTime, 1);
    const spanWeeks = Math.max(spanMs / (7 * 86400000), 1);
    const spanMonths = Math.max(spanMs / (30 * 86400000), 1);

    // Sum generations per user
    const userGens = new Map<string, number>();
    for (const r of records) {
      userGens.set(r.email, (userGens.get(r.email) || 0) + r.numberOfGenerations);
    }

    let active = 0;
    let casual = 0;
    for (const [, gens] of userGens) {
      const weeklyRate = gens / spanWeeks;
      const monthlyRate = gens / spanMonths;
      if (weeklyRate >= 15) {
        active++;
      } else if (monthlyRate >= 4) {
        casual++;
      }
    }
    return { activeUsers: active, casualUsers: casual };
  }, [records]);

  const monthlyTarget = targets.find((t) => t.period === 'monthly' && !t.email);
  const projection = useMemo(
    () => projectMonth(records, new Date(), monthlyTarget?.amount ?? null),
    [records, monthlyTarget]
  );
  const rangeProjection = useMemo(
    () => projectRange(records, monthlyTarget?.amount ?? null),
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
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4">
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
          title="All Users"
          value={formatNumber(uniqueUsers)}
          icon={<Users size={20} />}
          tooltip="Total unique email addresses that made at least one request in the selected date range."
          color="cyan"
        />
        <KpiCard
          title="Active Users"
          value={formatNumber(activeUsers)}
          subtitle={`of ${uniqueUsers} total`}
          icon={<Zap size={20} />}
          tooltip="Users generating 15+ images per week (based on their rate in the selected date range). These are your power users."
          color="emerald"
        />
        <KpiCard
          title="Casual Users"
          value={formatNumber(casualUsers)}
          subtitle={`4+ images/month`}
          icon={<Users size={20} />}
          tooltip="Users generating 4+ images per month but fewer than 15/week. Engaged but not heavy users."
          color="amber"
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
      {(() => {
        const br = isMonthMode ? projection.burnRate : rangeProjection.burnRate;
        const total = isMonthMode ? projection.currentTotal : rangeProjection.currentTotal;
        const proj = isMonthMode ? projection.projectedMonthTotal : rangeProjection.projectedNext30Days;
        const exhaust = isMonthMode ? projection.daysUntilBudgetExhausted : rangeProjection.daysUntilBudgetExhausted;

        if (monthlyTarget && exhaust !== null) {
          return (
            <div className={`rounded-xl border p-4 flex items-center gap-3 ${
              exhaust === 0
                ? 'bg-red-500/10 border-red-500/30 text-red-400'
                : exhaust <= 7
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            }`}>
              <Clock size={20} />
              <div>
                <p className="font-semibold text-sm">
                  {exhaust === 0
                    ? 'Budget exhausted! Current spend has exceeded the monthly target.'
                    : `At current burn rate (${formatCredits(br)}/day), budget will be exhausted in ~${exhaust} days`
                  }
                </p>
                <p className="text-xs mt-0.5 opacity-75">
                  {formatCredits(total)} spent &middot; Projected: {formatCredits(proj)}
                </p>
              </div>
            </div>
          );
        }

        return (
          <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-4 flex items-center gap-3 text-indigo-400">
            <TrendingUp size={20} />
            <div>
              <p className="font-semibold text-sm">
                Daily burn rate: {formatCredits(br)} credits/day &middot; {isMonthMode ? `Projected month total: ${formatCredits(proj)}` : `Projected next 30 days: ${formatCredits(proj)}`}
              </p>
              <p className="text-xs mt-0.5 opacity-75">
                Set a monthly target in Settings to track budget exhaustion
              </p>
            </div>
          </div>
        );
      })()}

      {/* Cumulative + Projection gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <ChartHeader
            title={isMonthMode ? 'Cumulative Month Spend vs Target' : `Cumulative Spend – ${rangeProjection.rangeLabel}`}
            tooltip="Solid line = actual cumulative spend so far. Dashed line = projected spend for remaining days. Red dashed line = your monthly target (if set)."
          />
          {isMonthMode ? (
            <CumulativeArea projection={projection} />
          ) : (
            <CumulativeRangeChart data={rangeProjection.cumulativeData} />
          )}
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <ChartHeader title="Monthly Projection" tooltip="Estimates end-of-month credit usage using a blend of linear regression (60%) and moving average (40%). Set a target in Settings to see on-track status." />
          <ProjectionGauge projection={projection} />
        </div>
      </div>

      {/* Daily credit spend */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <ChartHeader title="Credit Spend" tooltip="Amber bars = daily credit spend. Indigo line = 7-day moving average showing the underlying trend." />
        <CreditDualChart dailyData={dailySeries} />
      </div>

      {/* Top Spenders - unified view */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <ChartHeader title="Top Spenders" tooltip="Top 10 users by credits. Bar = credits, sparkline = daily trend, plus request count." />
        <div className="space-y-2">
          {(() => {
            const top10 = userAgg.slice(0, 10);
            const maxCredits = top10[0]?.totalCredits || 1;
            return top10.map((user, idx) => (
              <div key={user.email} className="flex items-center gap-3">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${
                  idx === 0 ? 'bg-amber-500' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-amber-700' : 'bg-gray-600'
                }`}>
                  {idx + 1}
                </span>
                <div className="w-36 shrink-0 truncate">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.email}</p>
                </div>
                <div className="flex-1 h-7 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden relative">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(user.totalCredits / maxCredits) * 100}%`,
                      backgroundColor: CHART_COLORS[idx % CHART_COLORS.length],
                      opacity: 0.7,
                    }}
                  />
                </div>
                <div className="w-20 h-8 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={user.dailyCredits}>
                      <Line type="monotone" dataKey="credits" stroke={CHART_COLORS[idx % CHART_COLORS.length]} strokeWidth={1.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <span className="text-xs text-gray-400 w-14 text-right shrink-0">{formatNumber(user.totalRequests)} req</span>
                <span className="text-sm font-bold text-indigo-400 w-14 text-right shrink-0">{formatCredits(user.totalCredits)}</span>
              </div>
            ));
          })()}
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

      {/* Model trends over time */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <ChartHeader title="Model Trends Over Time" tooltip="Weekly request count per model. Click legend labels to show/hide. See which models are growing or declining in popularity." />
        <ModelTrends records={records} />
      </div>
    </div>
  );
}
