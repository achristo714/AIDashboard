import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { CHART_COLORS } from '../../constants/chartColors';
import { formatNumber, formatCredits } from '../../utils/formatters';
import { useChartTheme } from '../../hooks/useChartTheme';
import type { TypeAggregation } from '../../utils/aggregations';

interface Props {
  data: TypeAggregation[];
}

const TYPE_LABELS: Record<string, string> = {
  image_to_image: 'Image to Image',
  image_upscale: 'Image Upscale',
  image_to_video: 'Image to Video',
  text_to_image: 'Text to Image',
};

export default function TypeBreakdown({ data }: Props) {
  const theme = useChartTheme();

  if (data.length === 0) {
    return <div className="h-80 flex items-center justify-center text-gray-400">No data available</div>;
  }

  // Filter out tiny slivers — group anything <2% into "Other"
  const total = data.reduce((s, d) => s + d.totalCredits, 0);
  const significant: (TypeAggregation & { displayType: string })[] = [];
  let otherCredits = 0;
  let otherRequests = 0;
  let otherGens = 0;
  for (const d of data) {
    if (d.totalCredits / total >= 0.02) {
      significant.push({ ...d, displayType: TYPE_LABELS[d.type] || d.type.replace(/_/g, ' ') });
    } else {
      otherCredits += d.totalCredits;
      otherRequests += d.totalRequests;
      otherGens += d.totalGenerations;
    }
  }
  if (otherCredits > 0) {
    significant.push({ type: 'other', displayType: 'Other', totalCredits: otherCredits, totalRequests: otherRequests, totalGenerations: otherGens });
  }

  return (
    <div className="flex items-center gap-4">
      <div className="shrink-0" style={{ width: 200, height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={significant}
              dataKey="totalCredits"
              nameKey="displayType"
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={90}
              paddingAngle={2}
            >
              {significant.map((_, idx) => (
                <Cell key={idx} fill={CHART_COLORS[(idx + 3) % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [`${formatNumber(Number(value))} credits`, name]}
              contentStyle={theme.tooltipStyle}
              labelStyle={theme.tooltipLabelStyle}
              itemStyle={theme.tooltipItemStyle}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex-1 min-w-0 space-y-1.5 overflow-y-auto max-h-[200px]">
        {significant.map((d, idx) => {
          const pct = ((d.totalCredits / total) * 100).toFixed(1);
          return (
            <div key={d.type} className="flex items-center gap-2 text-sm">
              <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: CHART_COLORS[(idx + 3) % CHART_COLORS.length] }} />
              <span className="flex-1 truncate text-gray-700 dark:text-gray-300">{d.displayType}</span>
              <span className="text-gray-400 text-xs shrink-0">{pct}%</span>
              <span className="font-medium text-gray-900 dark:text-white shrink-0 w-14 text-right">{formatCredits(d.totalCredits)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
