import { mean, standardDeviation, zScore } from 'simple-statistics';
import { parseISO, format } from 'date-fns';
import type { GenerationRecord, AnomalyFlag } from '../types/generation';

export function detectAnomalies(records: GenerationRecord[]): AnomalyFlag[] {
  const flags: AnomalyFlag[] = [];

  // 1. Duplicate detection (same id)
  const idCounts = new Map<string, number>();
  for (const r of records) {
    idCounts.set(r.id, (idCounts.get(r.id) || 0) + 1);
  }
  const seenDupeIds = new Set<string>();
  for (const r of records) {
    if ((idCounts.get(r.id) || 0) > 1 && !seenDupeIds.has(r.id)) {
      seenDupeIds.add(r.id);
      flags.push({
        recordId: r.id,
        type: 'duplicate',
        severity: 'high',
        message: `Duplicate ID found: ${r.id} appears ${idCounts.get(r.id)} times`,
        dismissed: false,
      });
    }
  }

  // 2. Missing data
  for (const r of records) {
    const missing: string[] = [];
    if (!r.time) missing.push('time');
    if (!r.email) missing.push('email');
    if (r.credits === null || r.credits === undefined) missing.push('credits');
    if (missing.length > 0) {
      flags.push({
        recordId: r.id,
        type: 'missing_data',
        severity: 'high',
        message: `Missing required fields: ${missing.join(', ')}`,
        dismissed: false,
      });
    }
  }

  // 3. Credit outliers (z-score > 2 relative to overall)
  const creditValues = records.map((r) => r.credits).filter((c) => c > 0);
  if (creditValues.length > 10) {
    const m = mean(creditValues);
    const sd = standardDeviation(creditValues);
    if (sd > 0) {
      for (const r of records) {
        const z = zScore(r.credits, m, sd);
        if (z > 3) {
          flags.push({
            recordId: r.id,
            type: 'outlier',
            severity: 'medium',
            message: `Unusually high credits: ${r.credits} (z-score: ${z.toFixed(1)}, mean: ${m.toFixed(1)})`,
            dismissed: false,
          });
        }
      }
    }
  }

  // 4. Usage spikes per user (daily credits > 2 SD above their rolling avg)
  const userDailyCredits = new Map<string, Map<string, number>>();
  for (const r of records) {
    const dateKey = format(parseISO(r.time), 'yyyy-MM-dd');
    if (!userDailyCredits.has(r.email)) {
      userDailyCredits.set(r.email, new Map());
    }
    const dayMap = userDailyCredits.get(r.email)!;
    dayMap.set(dateKey, (dayMap.get(dateKey) || 0) + r.credits);
  }

  for (const [email, dayMap] of userDailyCredits) {
    const dailyValues = Array.from(dayMap.values());
    if (dailyValues.length < 7) continue;
    const m = mean(dailyValues);
    const sd = standardDeviation(dailyValues);
    if (sd === 0) continue;

    for (const [date, credits] of dayMap) {
      const z = zScore(credits, m, sd);
      if (z > 2.5) {
        // Find a representative record for this date/user
        const record = records.find(
          (r) => r.email === email && r.time.startsWith(date)
        );
        if (record) {
          flags.push({
            recordId: record.id,
            type: 'spike',
            severity: 'medium',
            message: `${email} spent ${credits} credits on ${date} (z-score: ${z.toFixed(1)}, avg: ${m.toFixed(1)}/day)`,
            dismissed: false,
          });
        }
      }
    }
  }

  // 5. Date anomalies (future dates)
  const now = new Date();
  for (const r of records) {
    const date = parseISO(r.time);
    if (date > now) {
      flags.push({
        recordId: r.id,
        type: 'date_anomaly',
        severity: 'medium',
        message: `Future date detected: ${format(date, 'yyyy-MM-dd HH:mm')}`,
        dismissed: false,
      });
    }
  }

  return flags;
}
