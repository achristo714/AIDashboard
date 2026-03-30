import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { parseCSV } from '../../utils/csvParser';
import { detectAnomalies } from '../../utils/anomalyDetection';
import { useGenerationStore } from '../../store/generationStore';
import type { ParseResult } from '../../utils/csvParser';

export default function CsvUploader() {
  const { addRecords, setAnomalies } = useGenerationStore();
  const [status, setStatus] = useState<'idle' | 'parsing' | 'done' | 'error'>('idle');
  const [result, setResult] = useState<ParseResult | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      setStatus('parsing');
      try {
        const parsed = await parseCSV(file);
        setResult(parsed);

        if (parsed.records.length > 0) {
          addRecords(parsed.records);
          const anomalies = detectAnomalies(parsed.records);
          setAnomalies(anomalies);
          setStatus('done');
        } else {
          setStatus('error');
        }
      } catch {
        setStatus('error');
        setResult({ records: [], errors: ['Failed to parse CSV file'], totalRows: 0, skippedRows: 0 });
      }
    },
    [addRecords, setAnomalies]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv'],
    },
    maxFiles: 1,
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-800'
        }`}
      >
        <input {...getInputProps()} />
        {status === 'parsing' ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={40} className="text-indigo-500 animate-spin" />
            <p className="text-gray-600 dark:text-gray-300 font-medium">Parsing CSV...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Upload size={40} className="text-gray-400" />
            <div>
              <p className="text-gray-600 dark:text-gray-300 font-medium">
                {isDragActive ? 'Drop your CSV file here' : 'Drag & drop your CSV file here'}
              </p>
              <p className="text-sm text-gray-400 mt-1">or click to browse</p>
            </div>
          </div>
        )}
      </div>

      {result && status === 'done' && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
            <CheckCircle size={18} />
            <span className="font-medium">Upload successful</span>
          </div>
          <div className="mt-2 text-sm text-emerald-600 dark:text-emerald-400 space-y-1">
            <p><FileText size={14} className="inline mr-1" />{result.records.length.toLocaleString()} records imported</p>
            {result.skippedRows > 0 && (
              <p className="text-amber-600 dark:text-amber-400">{result.skippedRows} rows skipped due to errors</p>
            )}
          </div>
        </div>
      )}

      {result && status === 'error' && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
            <AlertCircle size={18} />
            <span className="font-medium">Upload failed</span>
          </div>
          {result.errors.length > 0 && (
            <ul className="mt-2 text-sm text-red-600 dark:text-red-400 space-y-1">
              {result.errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
