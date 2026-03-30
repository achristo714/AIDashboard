import { useState, type ReactNode } from 'react';
import { Info } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: ReactNode;
  tooltip?: string;
  trend?: { value: number; label: string };
  color?: string;
}

export default function KpiCard({ title, value, subtitle, icon, tooltip, trend, color = 'indigo' }: KpiCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const colorMap: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    red: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    violet: 'bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
    cyan: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 flex items-start gap-4 relative">
      <div className={`p-3 rounded-lg ${colorMap[color] || colorMap.indigo}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          {tooltip && (
            <div
              className="relative"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            >
              <Info size={13} className="text-gray-400 dark:text-gray-500 cursor-help" />
              {showTooltip && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg shadow-lg z-50 leading-relaxed">
                  {tooltip}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
                </div>
              )}
            </div>
          )}
        </div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
        {subtitle && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate">{subtitle}</p>
        )}
        {trend && (
          <p className={`text-xs mt-1 ${trend.value >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
            {trend.value >= 0 ? '+' : ''}{trend.value.toFixed(1)}% {trend.label}
          </p>
        )}
      </div>
    </div>
  );
}
