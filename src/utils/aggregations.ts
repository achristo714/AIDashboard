import { startOfWeek, startOfMonth, format, parseISO } from 'date-fns';
import type { GenerationRecord, TimeGranularity } from '../types/generation';

export interface TimeSeriesPoint {
  date: string;
  label: string;
  totalCredits: number;
  totalGenerations: number;
  totalRequests: number;
  uniqueUsers: number;
}

export interface UserAggregation {
  email: string;
  totalCredits: number;
  totalGenerations: number;
  totalRequests: number;
  avgCreditsPerRequest: number;
  models: Record<string, number>;
  types: Record<string, number>;
  dailyCredits: { date: string; credits: number }[];
}

export interface ModelAggregation {
  modelName: string;
  totalCredits: number;
  totalGenerations: number;
  totalRequests: number;
}

export interface TypeAggregation {
  type: string;
  totalCredits: number;
  totalGenerations: number;
  totalRequests: number;
}

export interface HourlyAggregation {
  hour: number;
  dayOfWeek: number;
  totalRequests: number;
}

function getDateKey(time: string, granularity: TimeGranularity): string {
  const date = parseISO(time);
  switch (granularity) {
    case 'daily':
      return format(date, 'yyyy-MM-dd');
    case 'weekly':
      return format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    case 'monthly':
      return format(startOfMonth(date), 'yyyy-MM');
  }
}

function getDateLabel(key: string, granularity: TimeGranularity): string {
  switch (granularity) {
    case 'daily':
      return format(parseISO(key), 'MMM d');
    case 'weekly':
      return `Week of ${format(parseISO(key), 'MMM d')}`;
    case 'monthly':
      return format(parseISO(key + '-01'), 'MMM yyyy');
  }
}

export function aggregateByTime(
  records: GenerationRecord[],
  granularity: TimeGranularity
): TimeSeriesPoint[] {
  const map = new Map<string, { credits: number; generations: number; requests: number; users: Set<string> }>();

  for (const r of records) {
    const key = getDateKey(r.time, granularity);
    const existing = map.get(key);
    if (existing) {
      existing.credits += r.credits;
      existing.generations += r.numberOfGenerations;
      existing.requests += 1;
      existing.users.add(r.email);
    } else {
      map.set(key, {
        credits: r.credits,
        generations: r.numberOfGenerations,
        requests: 1,
        users: new Set([r.email]),
      });
    }
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, val]) => ({
      date: key,
      label: getDateLabel(key, granularity),
      totalCredits: val.credits,
      totalGenerations: val.generations,
      totalRequests: val.requests,
      uniqueUsers: val.users.size,
    }));
}

export function aggregateByUser(records: GenerationRecord[]): UserAggregation[] {
  const map = new Map<string, {
    credits: number; generations: number; requests: number;
    models: Record<string, number>; types: Record<string, number>;
    daily: Map<string, number>;
  }>();

  for (const r of records) {
    const existing = map.get(r.email);
    const dateKey = format(parseISO(r.time), 'yyyy-MM-dd');
    if (existing) {
      existing.credits += r.credits;
      existing.generations += r.numberOfGenerations;
      existing.requests += 1;
      existing.models[r.modelName] = (existing.models[r.modelName] || 0) + r.credits;
      existing.types[r.type] = (existing.types[r.type] || 0) + r.credits;
      existing.daily.set(dateKey, (existing.daily.get(dateKey) || 0) + r.credits);
    } else {
      const daily = new Map<string, number>();
      daily.set(dateKey, r.credits);
      map.set(r.email, {
        credits: r.credits,
        generations: r.numberOfGenerations,
        requests: 1,
        models: { [r.modelName]: r.credits },
        types: { [r.type]: r.credits },
        daily,
      });
    }
  }

  return Array.from(map.entries())
    .map(([email, val]) => ({
      email,
      totalCredits: val.credits,
      totalGenerations: val.generations,
      totalRequests: val.requests,
      avgCreditsPerRequest: val.requests > 0 ? val.credits / val.requests : 0,
      models: val.models,
      types: val.types,
      dailyCredits: Array.from(val.daily.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, credits]) => ({ date, credits })),
    }))
    .sort((a, b) => b.totalCredits - a.totalCredits);
}

export function aggregateByModel(records: GenerationRecord[]): ModelAggregation[] {
  const map = new Map<string, { credits: number; generations: number; requests: number }>();

  for (const r of records) {
    const existing = map.get(r.modelName);
    if (existing) {
      existing.credits += r.credits;
      existing.generations += r.numberOfGenerations;
      existing.requests += 1;
    } else {
      map.set(r.modelName, { credits: r.credits, generations: r.numberOfGenerations, requests: 1 });
    }
  }

  return Array.from(map.entries())
    .map(([modelName, val]) => ({
      modelName,
      totalCredits: val.credits,
      totalGenerations: val.generations,
      totalRequests: val.requests,
    }))
    .sort((a, b) => b.totalCredits - a.totalCredits);
}

export function aggregateByType(records: GenerationRecord[]): TypeAggregation[] {
  const map = new Map<string, { credits: number; generations: number; requests: number }>();

  for (const r of records) {
    const existing = map.get(r.type);
    if (existing) {
      existing.credits += r.credits;
      existing.generations += r.numberOfGenerations;
      existing.requests += 1;
    } else {
      map.set(r.type, { credits: r.credits, generations: r.numberOfGenerations, requests: 1 });
    }
  }

  return Array.from(map.entries())
    .map(([type, val]) => ({
      type,
      totalCredits: val.credits,
      totalGenerations: val.generations,
      totalRequests: val.requests,
    }))
    .sort((a, b) => b.totalCredits - a.totalCredits);
}

export function aggregateByHour(records: GenerationRecord[]): HourlyAggregation[] {
  const map = new Map<string, number>();

  for (const r of records) {
    const date = parseISO(r.time);
    const hour = date.getUTCHours();
    const dow = date.getUTCDay();
    const key = `${dow}-${hour}`;
    map.set(key, (map.get(key) || 0) + 1);
  }

  return Array.from(map.entries()).map(([key, count]) => {
    const [dow, hour] = key.split('-').map(Number);
    return { hour, dayOfWeek: dow, totalRequests: count };
  });
}

export function getDateRange(records: GenerationRecord[]): { min: string; max: string } | null {
  if (records.length === 0) return null;
  let min = records[0].time;
  let max = records[0].time;
  for (const r of records) {
    if (r.time < min) min = r.time;
    if (r.time > max) max = r.time;
  }
  return { min, max };
}
