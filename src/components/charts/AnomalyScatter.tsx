import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ZAxis } from 'recharts';
import { parseISO, format } from 'date-fns';
import { formatNumber } from '../../utils/formatters';
import { useChartTheme } from '../../hooks/useChartTheme';
import type { GenerationRecord, AnomalyFlag } from '../../types/generation';

interface Props {
  records: GenerationRecord[];
  anomalies: AnomalyFlag[];
}

export default function AnomalyScatter({ records, anomalies }: Props) {
  const theme = useChartTheme();
  const anomalyIds = new Set(anomalies.filter((a) => !a.dismissed).map((a) => a.recordId));

  // Sample records for performance (max 2000 points)
  const step = Math.max(1, Math.floor(records.length / 2000));
  const sampled = records.filter((_, i) => i % step === 0 || anomalyIds.has(records[i].id));

  const normalPoints = sampled
    .filter((r) => !anomalyIds.has(r.id))
    .map((r) => ({
      x: parseISO(r.time).getTime(),
      y: r.credits,
      email: r.email,
    }));

  const anomalyPoints = sampled
    .filter((r) => anomalyIds.has(r.id))
    .map((r) => ({
      x: parseISO(r.time).getTime(),
      y: r.credits,
      email: r.email,
    }));

  if (sampled.length === 0) {
    return <div className="h-80 flex items-center justify-center text-gray-400">No data available</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={360}>
      <ScatterChart margin={{ left: 10, right: 10, top: 5, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.gridColor} />
        <XAxis
          type="number"
          dataKey="x"
          domain={['auto', 'auto']}
          tickFormatter={(v) => format(new Date(v), 'MMM d')}
          name="Date"
          tick={{ fill: theme.tickColor }}
        />
        <YAxis type="number" dataKey="y" name="Credits" tickFormatter={(v) => formatNumber(v)} tick={{ fill: theme.tickColor }} />
        <ZAxis range={[20, 20]} />
        <Tooltip
          formatter={(value, name) => {
            if (name === 'Date') return format(new Date(Number(value)), 'MMM d, yyyy HH:mm');
            return formatNumber(Number(value));
          }}
          contentStyle={theme.tooltipStyle}
        />
        <Scatter name="Normal" data={normalPoints} fill="#94a3b8" fillOpacity={0.4} />
        <Scatter name="Anomaly" data={anomalyPoints} fill="#ef4444" fillOpacity={0.8} />
      </ScatterChart>
    </ResponsiveContainer>
  );
}
