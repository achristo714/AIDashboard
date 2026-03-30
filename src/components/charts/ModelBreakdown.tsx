import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { CHART_COLORS } from '../../constants/chartColors';
import { formatNumber, formatCredits } from '../../utils/formatters';
import { useChartTheme } from '../../hooks/useChartTheme';
import type { ModelAggregation } from '../../utils/aggregations';

interface Props {
  data: ModelAggregation[];
  dataKey?: 'totalCredits' | 'totalRequests';
  label?: string;
}

export default function ModelBreakdown({ data, dataKey = 'totalCredits', label = 'Credits' }: Props) {
  const theme = useChartTheme();

  if (data.length === 0) {
    return <div className="h-80 flex items-center justify-center text-gray-400">No data available</div>;
  }

  // Filter out tiny slivers — group anything <2% into "Other"
  const total = data.reduce((s, d) => s + d[dataKey], 0);
  const significant: ModelAggregation[] = [];
  let otherCredits = 0;
  let otherRequests = 0;
  let otherGens = 0;
  for (const d of data) {
    if (d[dataKey] / total >= 0.02) {
      significant.push(d);
    } else {
      otherCredits += d.totalCredits;
      otherRequests += d.totalRequests;
      otherGens += d.totalGenerations;
    }
  }
  if (otherCredits > 0 || otherRequests > 0) {
    significant.push({ modelName: 'Other', totalCredits: otherCredits, totalRequests: otherRequests, totalGenerations: otherGens });
  }

  return (
    <div className="flex items-center gap-4">
      <div className="shrink-0" style={{ width: 200, height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={significant}
              dataKey={dataKey}
              nameKey="modelName"
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={90}
              paddingAngle={2}
            >
              {significant.map((_, idx) => (
                <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [`${formatNumber(Number(value))} ${label.toLowerCase()}`, name]}
              contentStyle={theme.tooltipStyle}
              labelStyle={theme.tooltipLabelStyle}
              itemStyle={theme.tooltipItemStyle}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex-1 min-w-0 space-y-1.5 overflow-y-auto max-h-[200px]">
        {significant.map((d, idx) => {
          const pct = ((d[dataKey] / total) * 100).toFixed(1);
          return (
            <div key={d.modelName} className="flex items-center gap-2 text-sm">
              <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }} />
              <span className="flex-1 truncate text-gray-700 dark:text-gray-300">{d.modelName}</span>
              <span className="text-gray-400 text-xs shrink-0">{pct}%</span>
              <span className="font-medium text-gray-900 dark:text-white shrink-0 w-14 text-right">{formatCredits(d[dataKey])}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
