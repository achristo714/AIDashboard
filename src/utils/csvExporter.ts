import Papa from 'papaparse';
import type { GenerationRecord } from '../types/generation';

export function exportToCSV(records: GenerationRecord[], filename = 'xfigura-export.csv'): void {
  const data = records.map((r) => ({
    id: r.id,
    Time: r.time,
    credits: r.credits,
    email: r.email,
    modelName: r.modelName,
    referenceId: r.referenceId,
    type: r.type,
    'Number of Generations': r.numberOfGenerations,
  }));

  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
