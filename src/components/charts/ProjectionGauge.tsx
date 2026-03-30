import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { STATUS_COLORS } from '../../constants/chartColors';
import { formatNumber, formatPercent } from '../../utils/formatters';
import type { ProjectionResult } from '../../utils/projections';

interface Props {
  projection: ProjectionResult;
}

const STATUS_LABELS: Record<string, string> = {
  on_track: 'On Track',
  at_risk: 'At Risk',
  below_target: 'Below Target',
  exceeding: 'Exceeding',
  no_target: 'No Target Set',
};

export default function ProjectionGauge({ projection }: Props) {
  const { status, percentOfTarget, projectedMonthTotal, currentTotal, targetAmount } = projection;
  const color = STATUS_COLORS[status];

  const percent = percentOfTarget ? Math.min(percentOfTarget, 150) : 0;
  const gaugeData = [
    { value: percent },
    { value: 150 - percent },
  ];

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: 200, height: 120 }}>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={gaugeData}
              startAngle={180}
              endAngle={0}
              innerRadius={70}
              outerRadius={90}
              dataKey="value"
              stroke="none"
            >
              <Cell fill={color} />
              <Cell fill="#e5e7eb" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
          <span className="text-2xl font-bold text-gray-900 dark:text-white">
            {percentOfTarget ? formatPercent(percentOfTarget) : '--'}
          </span>
        </div>
      </div>
      <div className="text-center mt-2 space-y-1">
        <span
          className="inline-block px-3 py-1 rounded-full text-xs font-medium text-white"
          style={{ backgroundColor: color }}
        >
          {STATUS_LABELS[status]}
        </span>
        <div className="text-sm text-gray-500 dark:text-gray-400 space-y-0.5">
          <p>Projected: <span className="font-medium text-gray-700 dark:text-gray-200">{formatNumber(projectedMonthTotal)}</span> credits</p>
          <p>Current: <span className="font-medium text-gray-700 dark:text-gray-200">{formatNumber(currentTotal)}</span> credits</p>
          {targetAmount && <p>Target: <span className="font-medium text-gray-700 dark:text-gray-200">{formatNumber(targetAmount)}</span> credits</p>}
        </div>
      </div>
    </div>
  );
}
