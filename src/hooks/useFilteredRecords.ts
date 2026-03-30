import { useMemo } from 'react';
import { startOfDay, subDays, startOfMonth, endOfMonth, subMonths, startOfQuarter } from 'date-fns';
import { useGenerationStore } from '../store/generationStore';
import type { GenerationRecord } from '../types/generation';

export function useFilteredRecords(): GenerationRecord[] {
  const { records, datePreset, customDateStart, customDateEnd } = useGenerationStore();

  return useMemo(() => {
    if (datePreset === 'all') return records;

    const now = new Date();
    let start: Date;
    let end: Date = now;

    switch (datePreset) {
      case 'today':
        start = startOfDay(now);
        break;
      case 'last7':
        start = startOfDay(subDays(now, 7));
        break;
      case 'last30':
        start = startOfDay(subDays(now, 30));
        break;
      case 'thisMonth':
        start = startOfMonth(now);
        break;
      case 'lastMonth': {
        const prev = subMonths(now, 1);
        start = startOfMonth(prev);
        end = endOfMonth(prev);
        break;
      }
      case 'thisQuarter':
        start = startOfQuarter(now);
        break;
      case 'custom':
        if (!customDateStart || !customDateEnd) return records;
        start = new Date(customDateStart + 'T00:00:00Z');
        end = new Date(customDateEnd + 'T23:59:59Z');
        break;
      default:
        return records;
    }

    const startIso = start.toISOString();
    const endIso = end.toISOString();

    return records.filter((r) => r.time >= startIso && r.time <= endIso);
  }, [records, datePreset, customDateStart, customDateEnd]);
}
