import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { CHART_COLORS } from '../../constants/chartColors';
import { formatNumber } from '../../utils/formatters';
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
  const labeled = data.map((d) => ({
    ...d,
    displayType: TYPE_LABELS[d.type] || d.type,
  }));

  if (labeled.length === 0) {
    return <div className="h-80 flex items-center justify-center text-gray-400">No data available</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <PieChart>
        <Pie
          data={labeled}
          dataKey="totalCredits"
          nameKey="displayType"
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={110}
          paddingAngle={2}
        >
          {labeled.map((_, idx) => (
            <Cell key={idx} fill={CHART_COLORS[(idx + 3) % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => [formatNumber(Number(value)) + ' credits', 'Credits']}
          contentStyle={theme.tooltipStyle}
        />
        <Legend
          verticalAlign="bottom"
          height={36}
          formatter={(value: string) => (
            <span className="text-xs text-gray-600 dark:text-gray-300">{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
