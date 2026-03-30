import Papa from 'papaparse';
import type { GenerationRecord } from '../types/generation';

interface RawRow {
  id: string;
  Time: string;
  credits: string;
  email: string;
  modelName: string;
  referenceId: string;
  type: string;
  'Number of Generations': string;
}

export interface ParseResult {
  records: GenerationRecord[];
  errors: string[];
  totalRows: number;
  skippedRows: number;
}

function parseTimeString(timeStr: string): string {
  if (!timeStr) return '';
  // Format: "10/09/2025, 20:39:03 UTC" → ISO string
  const cleaned = timeStr.replace(' UTC', '').trim();
  const [datePart, timePart] = cleaned.split(', ');
  if (!datePart || !timePart) return '';
  const [month, day, year] = datePart.split('/');
  if (!month || !day || !year) return '';
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${timePart}Z`;
}

export function parseCSV(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    const records: GenerationRecord[] = [];
    const errors: string[] = [];
    let totalRows = 0;
    let skippedRows = 0;

    Papa.parse<RawRow>(file, {
      header: true,
      skipEmptyLines: true,
      chunk: (results) => {
        for (const row of results.data) {
          totalRows++;
          const id = row.id?.trim();
          const timeStr = parseTimeString(row.Time);
          const credits = parseFloat(row.credits);
          const email = row.email?.trim();
          const modelName = row.modelName?.trim();
          const type = row.type?.trim();
          const referenceId = row.referenceId?.trim() || '';
          const numberOfGenerations = parseInt(row['Number of Generations'] || '0', 10);

          if (!id || !timeStr || !email) {
            skippedRows++;
            if (totalRows <= 10) {
              errors.push(`Row ${totalRows}: missing required field (id, time, or email)`);
            }
            continue;
          }

          if (isNaN(credits)) {
            skippedRows++;
            if (totalRows <= 10) {
              errors.push(`Row ${totalRows}: invalid credits value`);
            }
            continue;
          }

          records.push({
            id,
            time: timeStr,
            credits: isNaN(credits) ? 0 : credits,
            email,
            modelName: modelName || 'Unknown',
            referenceId,
            type: type || 'unknown',
            numberOfGenerations: isNaN(numberOfGenerations) ? 0 : numberOfGenerations,
          });
        }
      },
      complete: () => {
        if (skippedRows > 10) {
          errors.push(`... and ${skippedRows - 10} more rows with errors`);
        }
        resolve({ records, errors, totalRows, skippedRows });
      },
      error: (err) => {
        errors.push(`Parse error: ${err.message}`);
        resolve({ records, errors, totalRows, skippedRows });
      },
    });
  });
}
