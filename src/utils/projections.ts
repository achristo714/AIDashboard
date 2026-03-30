import { linearRegression, linearRegressionLine } from 'simple-statistics';
import { getDaysInMonth, parseISO, format, startOfMonth, endOfMonth, differenceInDays } from 'date-fns';
import type { GenerationRecord, ProjectionStatus } from '../types/generation';

export interface ProjectionResult {
  projectedMonthTotal: number;
  currentTotal: number;
  daysElapsed: number;
  daysInMonth: number;
  dailyAverage: number;
  movingAvgProjection: number;
  regressionProjection: number;
  status: ProjectionStatus;
  targetAmount: number | null;
  percentOfTarget: number | null;
  burnRate: number;
  daysUntilBudgetExhausted: number | null;
  cumulativeData: { day: number; actual: number; projected: number | null; target: number | null }[];
}

export function projectMonth(
  records: GenerationRecord[],
  targetMonth: Date,
  monthlyTarget: number | null
): ProjectionResult {
  const monthStart = startOfMonth(targetMonth);
  const monthEnd = endOfMonth(targetMonth);
  const daysInMonth = getDaysInMonth(targetMonth);
  const monthStr = format(monthStart, 'yyyy-MM');

  // Filter records for this month
  const monthRecords = records.filter((r) => r.time.startsWith(monthStr));

  // Group by day
  const dailyCredits = new Map<number, number>();
  for (const r of monthRecords) {
    const day = parseISO(r.time).getDate();
    dailyCredits.set(day, (dailyCredits.get(day) || 0) + r.credits);
  }

  // Calculate days elapsed (up to today or month end)
  const today = new Date();
  const effectiveEnd = today < monthEnd ? today : monthEnd;
  const daysElapsed = Math.max(1, differenceInDays(effectiveEnd, monthStart) + 1);

  // Current total
  let currentTotal = 0;
  for (const credits of dailyCredits.values()) {
    currentTotal += credits;
  }

  // Daily average
  const dailyAverage = currentTotal / daysElapsed;

  // Moving average projection (simple: daily avg × days in month)
  const movingAvgProjection = dailyAverage * daysInMonth;

  // Linear regression on cumulative daily spend
  const cumulativePoints: [number, number][] = [];
  let cumulative = 0;
  for (let day = 1; day <= daysElapsed; day++) {
    cumulative += dailyCredits.get(day) || 0;
    cumulativePoints.push([day, cumulative]);
  }

  let regressionProjection = movingAvgProjection;
  if (cumulativePoints.length >= 3) {
    const regression = linearRegression(cumulativePoints);
    const predict = linearRegressionLine(regression);
    regressionProjection = Math.max(0, predict(daysInMonth));
  }

  // Weighted blend (60% regression, 40% moving avg)
  const projectedMonthTotal = regressionProjection * 0.6 + movingAvgProjection * 0.4;

  // Burn rate
  const burnRate = dailyAverage;

  // Days until budget exhausted
  let daysUntilBudgetExhausted: number | null = null;
  if (monthlyTarget && burnRate > 0) {
    const remaining = monthlyTarget - currentTotal;
    daysUntilBudgetExhausted = remaining > 0 ? Math.ceil(remaining / burnRate) : 0;
  }

  // Status
  let status: ProjectionStatus = 'no_target';
  let percentOfTarget: number | null = null;
  if (monthlyTarget && monthlyTarget > 0) {
    percentOfTarget = (projectedMonthTotal / monthlyTarget) * 100;
    if (percentOfTarget >= 110) status = 'exceeding';
    else if (percentOfTarget >= 90) status = 'on_track';
    else if (percentOfTarget >= 75) status = 'at_risk';
    else status = 'below_target';
  }

  // Build cumulative chart data
  const cumulativeData: ProjectionResult['cumulativeData'] = [];
  cumulative = 0;
  for (let day = 1; day <= daysInMonth; day++) {
    if (day <= daysElapsed) {
      cumulative += dailyCredits.get(day) || 0;
      cumulativeData.push({
        day,
        actual: cumulative,
        projected: null,
        target: monthlyTarget ? (monthlyTarget / daysInMonth) * day : null,
      });
    } else {
      // Projected days
      const projectedDay = currentTotal + burnRate * (day - daysElapsed);
      cumulativeData.push({
        day,
        actual: 0,
        projected: projectedDay,
        target: monthlyTarget ? (monthlyTarget / daysInMonth) * day : null,
      });
    }
  }

  return {
    projectedMonthTotal,
    currentTotal,
    daysElapsed,
    daysInMonth,
    dailyAverage,
    movingAvgProjection,
    regressionProjection,
    status,
    targetAmount: monthlyTarget,
    percentOfTarget,
    burnRate,
    daysUntilBudgetExhausted,
    cumulativeData,
  };
}
