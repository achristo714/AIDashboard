import { useMemo } from 'react';
import { useFilteredRecords } from '../hooks/useFilteredRecords';
import { aggregateByUser, aggregateByModel, aggregateByType, aggregateByTime } from '../utils/aggregations';
import { formatNumber, formatCredits } from '../utils/formatters';
import { parseISO, format, differenceInDays, getDay } from 'date-fns';
import {
  Flame, TrendingUp, TrendingDown, Clock, Zap, Crown,
  AlertTriangle, BarChart3, Users, Calendar, Star, Target,
  Repeat, Moon, Sun, UserPlus, UserMinus, Sparkles, Hash,
  Trophy, Activity, Coffee, CalendarDays, Percent,
} from 'lucide-react';

interface Insight {
  icon: React.ReactNode;
  title: string;
  value: string;
  detail: string;
  color: string;
  category: 'spending' | 'calendar' | 'users' | 'platform';
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
        category: 'spending',
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
        category: 'calendar',
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
        category: 'spending',
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
          category: 'spending',
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
          category: 'users',
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
          category: 'users',
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
      category: 'calendar',
      color: 'text-cyan-500',
    });

    // 8. Avg credits per request
    const avgCredits = totalCredits / records.length;
    items.push({
      icon: <Zap size={22} />,
      title: 'Avg Credits Per Request',
      value: avgCredits.toFixed(2),
      detail: `Each request costs an average of ${avgCredits.toFixed(2)} credits across ${formatNumber(records.length)} total requests`,
      category: 'platform',
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
        category: 'platform',
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
      category: 'platform',
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
        category: 'users',
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
        category: 'spending',
        color: 'text-amber-400',
      });
    }

    // === CALENDAR & PATTERN INSIGHTS ===

    // 13. Busiest day of week
    const DOW_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dowCredits = new Array(7).fill(0);
    const dowRequests = new Array(7).fill(0);
    const dowCounts = new Array(7).fill(0);
    for (const d of daily) {
      const dow = getDay(parseISO(d.date));
      dowCredits[dow] += d.totalCredits;
      dowRequests[dow] += d.totalRequests;
      dowCounts[dow]++;
    }
    const dowAvg = dowCredits.map((c, i) => dowCounts[i] > 0 ? c / dowCounts[i] : 0);
    const busiestDow = dowAvg.indexOf(Math.max(...dowAvg));
    const slowestDow = dowAvg.indexOf(Math.min(...dowAvg.filter((v) => v > 0)));
    if (dowAvg[busiestDow] > 0) {
      items.push({
        icon: <CalendarDays size={22} />,
        title: 'Busiest Day of Week',
        value: `${DOW_NAMES[busiestDow]}s`,
        detail: `${DOW_NAMES[busiestDow]}s average ${formatCredits(dowAvg[busiestDow])} credits/day — ${((dowAvg[busiestDow] / (totalCredits / daySpan) - 1) * 100).toFixed(0)}% above the daily average`,
        category: 'calendar',
        color: 'text-blue-500',
      });
    }

    // 14. Slowest day of week
    if (dowAvg[slowestDow] > 0 && slowestDow !== busiestDow) {
      items.push({
        icon: <Coffee size={22} />,
        title: 'Quietest Day of Week',
        value: `${DOW_NAMES[slowestDow]}s`,
        detail: `${DOW_NAMES[slowestDow]}s average ${formatCredits(dowAvg[slowestDow])} credits/day — ${((1 - dowAvg[slowestDow] / (totalCredits / daySpan)) * 100).toFixed(0)}% below the daily average`,
        category: 'calendar',
        color: 'text-gray-400',
      });
    }

    // 15. Weekend vs weekday
    const weekdayCredits = [1, 2, 3, 4, 5].reduce((s, d) => s + dowCredits[d], 0);
    const weekendCredits = dowCredits[0] + dowCredits[6];
    const weekdayDays = [1, 2, 3, 4, 5].reduce((s, d) => s + dowCounts[d], 0);
    const weekendDays = dowCounts[0] + dowCounts[6];
    if (weekendDays > 0 && weekdayDays > 0) {
      const weekdayAvg = weekdayCredits / weekdayDays;
      const weekendAvg = weekendCredits / weekendDays;
      const ratio = weekendAvg / weekdayAvg;
      items.push({
        icon: ratio > 1 ? <Sun size={22} /> : <Moon size={22} />,
        title: 'Weekend vs Weekday',
        value: ratio > 1 ? `${((ratio - 1) * 100).toFixed(0)}% busier` : `${((1 - ratio) * 100).toFixed(0)}% quieter`,
        detail: `Weekends average ${formatCredits(weekendAvg)}/day vs weekdays at ${formatCredits(weekdayAvg)}/day`,
        category: 'calendar',
        color: ratio > 1 ? 'text-orange-400' : 'text-blue-400',
      });
    }

    // 16. Dead hour (quietest time)
    const quietHour = hourBuckets.indexOf(Math.min(...hourBuckets));
    items.push({
      icon: <Moon size={22} />,
      title: 'Quietest Hour (UTC)',
      value: `${quietHour}:00 - ${quietHour + 1}:00`,
      detail: `Only ${formatNumber(hourBuckets[quietHour])} requests during this hour (${((hourBuckets[quietHour] / records.length) * 100).toFixed(1)}% of traffic)`,
      category: 'calendar',
      color: 'text-slate-400',
    });

    // === USER BEHAVIOR INSIGHTS ===

    // 17. Longest user streak (consecutive days active)
    for (const user of userAgg.slice(0, 5)) {
      const activeDates = new Set(user.dailyCredits.map((d) => d.date));
      const sortedDates = [...activeDates].sort();
      let maxStreak = 1, currentStreak = 1;
      for (let i = 1; i < sortedDates.length; i++) {
        const diff = differenceInDays(parseISO(sortedDates[i]), parseISO(sortedDates[i - 1]));
        if (diff === 1) {
          currentStreak++;
          maxStreak = Math.max(maxStreak, currentStreak);
        } else {
          currentStreak = 1;
        }
      }
      if (maxStreak >= 5) {
        items.push({
          icon: <Repeat size={22} />,
          title: 'Longest User Streak',
          value: `${maxStreak} consecutive days`,
          detail: `${user.email} was active ${maxStreak} days in a row — that's dedication`,
          category: 'users',
          color: 'text-emerald-400',
        });
        break;
      }
    }

    // 18. Platform longest streak (consecutive days with any activity)
    {
      const dailyDates = daily.map((d) => d.date).sort();
      let maxStreak = 1, currentStreak = 1;
      for (let i = 1; i < dailyDates.length; i++) {
        const diff = differenceInDays(parseISO(dailyDates[i]), parseISO(dailyDates[i - 1]));
        if (diff === 1) {
          currentStreak++;
          maxStreak = Math.max(maxStreak, currentStreak);
        } else {
          currentStreak = 1;
        }
      }
      items.push({
        icon: <Activity size={22} />,
        title: 'Platform Activity Streak',
        value: `${maxStreak} days straight`,
        detail: `The longest streak of consecutive days with at least one generation request`,
        category: 'platform',
        color: 'text-green-500',
      });
    }

    // 19. Most diverse user (uses the most models)
    {
      let mostModels = { email: '', count: 0, models: '' };
      for (const user of userAgg.slice(0, 30)) {
        const modelCount = Object.keys(user.models).length;
        if (modelCount > mostModels.count) {
          mostModels = { email: user.email, count: modelCount, models: Object.keys(user.models).join(', ') };
        }
      }
      if (mostModels.count >= 3) {
        items.push({
          icon: <Sparkles size={22} />,
          title: 'Most Diverse User',
          value: `${mostModels.count} models used`,
          detail: `${mostModels.email} experiments across ${mostModels.count} models: ${mostModels.models}`,
          category: 'users',
          color: 'text-purple-400',
        });
      }
    }

    // 20. One-trick pony (user who only uses one model)
    {
      const singleModelUsers = userAgg.filter((u) => Object.keys(u.models).length === 1 && u.totalRequests >= 20);
      if (singleModelUsers.length > 0) {
        const top = singleModelUsers[0];
        const model = Object.keys(top.models)[0];
        items.push({
          icon: <Target size={22} />,
          title: 'Most Loyal to One Model',
          value: model,
          detail: `${top.email} has only ever used ${model} across all ${formatNumber(top.totalRequests)} requests`,
          category: 'users',
          color: 'text-rose-400',
        });
      }
    }

    // 21. New users (first seen in last 7 days of the data range)
    {
      const lastWeekStart = format(new Date(lastDate.getTime() - 7 * 86400000), 'yyyy-MM-dd');
      const userFirstSeen = new Map<string, string>();
      for (const r of records) {
        const date = r.time.slice(0, 10);
        if (!userFirstSeen.has(r.email) || date < userFirstSeen.get(r.email)!) {
          userFirstSeen.set(r.email, date);
        }
      }
      const newUsers = [...userFirstSeen.entries()].filter(([, d]) => d >= lastWeekStart);
      if (newUsers.length > 0) {
        items.push({
          icon: <UserPlus size={22} />,
          title: 'New Users (Last 7 Days)',
          value: `${newUsers.length} new`,
          detail: `${newUsers.length} user${newUsers.length > 1 ? 's' : ''} made their first request in the last 7 days of data: ${newUsers.slice(0, 3).map(([e]) => e).join(', ')}${newUsers.length > 3 ? ` +${newUsers.length - 3} more` : ''}`,
          category: 'users',
          color: 'text-green-400',
        });
      }
    }

    // 22. Churned users (active in first half, zero in last 14 days)
    if (daySpan >= 21) {
      const last14Start = format(new Date(lastDate.getTime() - 14 * 86400000), 'yyyy-MM-dd');
      const recentEmails = new Set(records.filter((r) => r.time.slice(0, 10) >= last14Start).map((r) => r.email));
      const churned = userAgg.filter((u) => !recentEmails.has(u.email) && u.totalCredits > 100);
      if (churned.length > 0) {
        const totalChurnedCredits = churned.reduce((s, u) => s + u.totalCredits, 0);
        items.push({
          icon: <UserMinus size={22} />,
          title: 'Potentially Churned Users',
          value: `${churned.length} user${churned.length > 1 ? 's' : ''}`,
          detail: `${churned.length} users were active earlier but had zero activity in the last 14 days. They spent ${formatCredits(totalChurnedCredits)} total.`,
          category: 'users',
          color: 'text-red-300',
        });
      }
    }

    // 23. Avg requests per user
    const avgReqPerUser = records.length / uniqueUsers;
    items.push({
      icon: <Hash size={22} />,
      title: 'Avg Requests Per User',
      value: formatNumber(avgReqPerUser),
      detail: `${formatNumber(records.length)} requests spread across ${uniqueUsers} users — on average ${avgReqPerUser.toFixed(1)} requests each`,
      category: 'platform',
      color: 'text-sky-500',
    });

    // 24. Top 3 users as % of total
    if (userAgg.length >= 3) {
      const top3Credits = userAgg.slice(0, 3).reduce((s, u) => s + u.totalCredits, 0);
      const top3Pct = ((top3Credits / totalCredits) * 100).toFixed(1);
      items.push({
        icon: <Trophy size={22} />,
        title: 'Top 3 Concentration',
        value: `${top3Pct}%`,
        detail: `The top 3 users (${userAgg.slice(0, 3).map((u) => u.email.split('@')[0]).join(', ')}) account for ${top3Pct}% of all credits`,
        category: 'users',
        color: 'text-amber-300',
      });
    }

    // 25. Biggest single request
    {
      const biggest = [...records].sort((a, b) => b.credits - a.credits)[0];
      if (biggest) {
        items.push({
          icon: <Zap size={22} />,
          title: 'Biggest Single Request',
          value: `${biggest.credits} credits`,
          detail: `By ${biggest.email} on ${format(parseISO(biggest.time), 'MMM d, yyyy HH:mm')} using ${biggest.modelName} (${biggest.type.replace(/_/g, ' ')})`,
          category: 'spending',
          color: 'text-yellow-400',
        });
      }
    }

    // 26. Credits per active day
    {
      const creditsPerActiveDay = totalCredits / activeDays;
      items.push({
        icon: <Percent size={22} />,
        title: 'Credits Per Active Day',
        value: formatCredits(creditsPerActiveDay),
        detail: `On days with activity, the platform averages ${formatCredits(creditsPerActiveDay)} credits (${activeDays} active days total)`,
        category: 'platform',
        color: 'text-lime-500',
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

      {([
        { key: 'spending', label: 'Spending & Models', desc: 'Where the credits are going' },
        { key: 'calendar', label: 'Calendar & Patterns', desc: 'When things happen' },
        { key: 'users', label: 'User Behavior', desc: 'Who is doing what' },
        { key: 'platform', label: 'Platform Stats', desc: 'Overall health metrics' },
      ] as const).map((section) => {
        const sectionInsights = insights.filter((i) => i.category === section.key);
        if (sectionInsights.length === 0) return null;
        return (
          <div key={section.key} className="space-y-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{section.label}</h3>
              <p className="text-xs text-gray-400">{section.desc}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {sectionInsights.map((insight, idx) => (
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
      })}
    </div>
  );
}
