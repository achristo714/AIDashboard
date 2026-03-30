import { useMemo } from 'react';
import { useFilteredRecords } from '../hooks/useFilteredRecords';
import { aggregateByUser, aggregateByModel, aggregateByType, aggregateByTime } from '../utils/aggregations';
import { formatNumber, formatCredits } from '../utils/formatters';
import { parseISO, format, differenceInDays } from 'date-fns';
import {
  Flame, TrendingUp, TrendingDown, Clock, Zap, Crown,
  AlertTriangle, BarChart3, Users, Calendar, Star, Target,
} from 'lucide-react';

interface Insight {
  icon: React.ReactNode;
  title: string;
  value: string;
  detail: string;
  color: string;
}

export default function InsightsPage() {
  const records = useFilteredRecords();

  const insights = useMemo(() => {
    if (records.length === 0) return [];

    const items: Insight[] = [];
    const userAgg = aggregateByUser(records);
    const modelAgg = aggregateByModel(records);
    const typeAgg = aggregateByType(records);
    const daily = aggregateByTime(records, 'daily');

    const totalCredits = records.reduce((s, r) => s + r.credits, 0);
    const totalGenerations = records.reduce((s, r) => s + r.numberOfGenerations, 0);
    const uniqueUsers = new Set(records.map((r) => r.email)).size;

    // Date range
    const dates = records.map((r) => r.time).sort();
    const firstDate = parseISO(dates[0]);
    const lastDate = parseISO(dates[dates.length - 1]);
    const daySpan = Math.max(1, differenceInDays(lastDate, firstDate) + 1);

    // 1. Top spender dominance
    if (userAgg.length >= 2) {
      const top = userAgg[0];
      const pct = ((top.totalCredits / totalCredits) * 100).toFixed(1);
      items.push({
        icon: <Crown size={22} />,
        title: 'Top Spender Dominance',
        value: `${pct}%`,
        detail: `${top.email} accounts for ${pct}% of all credits (${formatCredits(top.totalCredits)} of ${formatCredits(totalCredits)})`,
        color: 'text-amber-500',
      });
    }

    // 2. Busiest day ever
    if (daily.length > 0) {
      const busiest = [...daily].sort((a, b) => b.totalCredits - a.totalCredits)[0];
      items.push({
        icon: <Flame size={22} />,
        title: 'Busiest Day',
        value: busiest.label,
        detail: `${formatCredits(busiest.totalCredits)} credits burned in a single day with ${formatNumber(busiest.totalRequests)} requests`,
        color: 'text-red-500',
      });
    }

    // 3. Most popular model
    if (modelAgg.length > 0) {
      const top = modelAgg[0];
      const pct = ((top.totalRequests / records.length) * 100).toFixed(1);
      items.push({
        icon: <Star size={22} />,
        title: 'Most Popular Model',
        value: top.modelName,
        detail: `Used in ${pct}% of all requests (${formatNumber(top.totalRequests)} requests, ${formatCredits(top.totalCredits)} credits)`,
        color: 'text-violet-500',
      });
    }

    // 4. Most expensive model (highest avg credits per request)
    if (modelAgg.length > 1) {
      const expensive = [...modelAgg]
        .filter((m) => m.totalRequests >= 10)
        .sort((a, b) => (b.totalCredits / b.totalRequests) - (a.totalCredits / a.totalRequests))[0];
      if (expensive) {
        const avg = (expensive.totalCredits / expensive.totalRequests).toFixed(1);
        items.push({
          icon: <Target size={22} />,
          title: 'Most Expensive Model',
          value: expensive.modelName,
          detail: `Averages ${avg} credits per request (${formatNumber(expensive.totalRequests)} requests total)`,
          color: 'text-orange-500',
        });
      }
    }

    // 5. Fastest growing user (compare first half vs second half)
    if (userAgg.length > 0 && daySpan >= 14) {
      const midDate = format(new Date((firstDate.getTime() + lastDate.getTime()) / 2), 'yyyy-MM-dd');
      let bestGrowth = { email: '', ratio: 0, firstHalf: 0, secondHalf: 0 };
      for (const user of userAgg.slice(0, 20)) {
        let firstHalf = 0, secondHalf = 0;
        for (const d of user.dailyCredits) {
          if (d.date < midDate) firstHalf += d.credits;
          else secondHalf += d.credits;
        }
        if (firstHalf > 100) {
          const ratio = secondHalf / firstHalf;
          if (ratio > bestGrowth.ratio) {
            bestGrowth = { email: user.email, ratio, firstHalf, secondHalf };
          }
        }
      }
      if (bestGrowth.ratio > 1.2) {
        items.push({
          icon: <TrendingUp size={22} />,
          title: 'Fastest Growing User',
          value: `${((bestGrowth.ratio - 1) * 100).toFixed(0)}% increase`,
          detail: `${bestGrowth.email} spent ${formatCredits(bestGrowth.secondHalf)} in the second half vs ${formatCredits(bestGrowth.firstHalf)} in the first half`,
          color: 'text-emerald-500',
        });
      }
    }

    // 6. Declining user
    if (userAgg.length > 0 && daySpan >= 14) {
      const midDate = format(new Date((firstDate.getTime() + lastDate.getTime()) / 2), 'yyyy-MM-dd');
      let biggestDrop = { email: '', ratio: Infinity, firstHalf: 0, secondHalf: 0 };
      for (const user of userAgg.slice(0, 20)) {
        let firstHalf = 0, secondHalf = 0;
        for (const d of user.dailyCredits) {
          if (d.date < midDate) firstHalf += d.credits;
          else secondHalf += d.credits;
        }
        if (firstHalf > 100) {
          const ratio = secondHalf / firstHalf;
          if (ratio < biggestDrop.ratio) {
            biggestDrop = { email: user.email, ratio, firstHalf, secondHalf };
          }
        }
      }
      if (biggestDrop.ratio < 0.5) {
        items.push({
          icon: <TrendingDown size={22} />,
          title: 'Biggest Decline',
          value: `${((1 - biggestDrop.ratio) * 100).toFixed(0)}% drop`,
          detail: `${biggestDrop.email} went from ${formatCredits(biggestDrop.firstHalf)} to ${formatCredits(biggestDrop.secondHalf)}`,
          color: 'text-red-400',
        });
      }
    }

    // 7. Peak hour
    const hourBuckets = new Array(24).fill(0);
    for (const r of records) {
      const hour = parseISO(r.time).getUTCHours();
      hourBuckets[hour]++;
    }
    const peakHour = hourBuckets.indexOf(Math.max(...hourBuckets));
    items.push({
      icon: <Clock size={22} />,
      title: 'Peak Hour (UTC)',
      value: `${peakHour}:00 - ${peakHour + 1}:00`,
      detail: `${formatNumber(hourBuckets[peakHour])} requests happen during this hour, ${((hourBuckets[peakHour] / records.length) * 100).toFixed(1)}% of all traffic`,
      color: 'text-cyan-500',
    });

    // 8. Avg credits per request
    const avgCredits = totalCredits / records.length;
    items.push({
      icon: <Zap size={22} />,
      title: 'Avg Credits Per Request',
      value: avgCredits.toFixed(2),
      detail: `Each request costs an average of ${avgCredits.toFixed(2)} credits across ${formatNumber(records.length)} total requests`,
      color: 'text-yellow-500',
    });

    // 9. Generation efficiency
    if (totalGenerations > 0) {
      const creditsPerGen = totalCredits / totalGenerations;
      items.push({
        icon: <BarChart3 size={22} />,
        title: 'Cost Per Generation',
        value: `${creditsPerGen.toFixed(2)} credits`,
        detail: `${formatNumber(totalGenerations)} images generated for ${formatCredits(totalCredits)} credits total`,
        color: 'text-indigo-500',
      });
    }

    // 10. Active days
    const activeDays = daily.filter((d) => d.totalRequests > 0).length;
    items.push({
      icon: <Calendar size={22} />,
      title: 'Active Days',
      value: `${activeDays} of ${daySpan}`,
      detail: `Platform had activity on ${activeDays} out of ${daySpan} days (${((activeDays / daySpan) * 100).toFixed(0)}% uptime)`,
      color: 'text-teal-500',
    });

    // 11. Power users (>10% of total credits)
    const powerUsers = userAgg.filter((u) => u.totalCredits > totalCredits * 0.05);
    if (powerUsers.length > 0) {
      const powerPct = ((powerUsers.reduce((s, u) => s + u.totalCredits, 0) / totalCredits) * 100).toFixed(1);
      items.push({
        icon: <Users size={22} />,
        title: 'Power User Concentration',
        value: `${powerUsers.length} users = ${powerPct}%`,
        detail: `${powerUsers.length} power users (>5% each) account for ${powerPct}% of total spend out of ${uniqueUsers} total users`,
        color: 'text-pink-500',
      });
    }

    // 12. Type diversity
    if (typeAgg.length > 1) {
      const topType = typeAgg[0];
      const topPct = ((topType.totalRequests / records.length) * 100).toFixed(1);
      items.push({
        icon: <AlertTriangle size={22} />,
        title: 'Dominant Generation Type',
        value: topType.type.replace(/_/g, ' '),
        detail: `${topPct}% of all requests are ${topType.type.replace(/_/g, ' ')} (${formatNumber(topType.totalRequests)} requests)`,
        color: 'text-amber-400',
      });
    }

    return items;
  }, [records]);

  if (records.length === 0) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-gray-400">
        Upload data to see insights
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Insights</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Auto-generated highlights from your data at a glance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {insights.map((insight, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors"
          >
            <div className="flex items-start gap-4">
              <div className={`${insight.color} mt-0.5`}>
                {insight.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{insight.title}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{insight.value}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">{insight.detail}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
