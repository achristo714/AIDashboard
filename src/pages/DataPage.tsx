import { useMemo, useState } from 'react';
import { useGenerationStore } from '../store/generationStore';
import CsvUploader from '../components/upload/CsvUploader';
import { exportToCSV } from '../utils/csvExporter';
import { formatNumber } from '../utils/formatters';
import { Download, Trash2, Search } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const PAGE_SIZE = 100;

export default function DataPage() {
  const { records, clearRecords } = useGenerationStore();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [sortBy, setSortBy] = useState<'time' | 'credits' | 'email'>('time');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const filtered = useMemo(() => {
    let result = [...records];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.email.toLowerCase().includes(q) ||
          r.modelName.toLowerCase().includes(q) ||
          r.type.toLowerCase().includes(q) ||
          r.id.toLowerCase().includes(q)
      );
    }
    result.sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      if (sortBy === 'credits') return (a.credits - b.credits) * dir;
      if (sortBy === 'email') return a.email.localeCompare(b.email) * dir;
      return a.time.localeCompare(b.time) * dir;
    });
    return result;
  }, [records, search, sortBy, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageData = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const toggleSort = (col: typeof sortBy) => {
    if (sortBy === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(col);
      setSortDir('desc');
    }
    setPage(0);
  };

  const sortIndicator = (col: typeof sortBy) => {
    if (sortBy !== col) return '';
    return sortDir === 'asc' ? ' \u2191' : ' \u2193';
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Data Management</h2>

      {/* Upload */}
      <CsvUploader />

      {records.length > 0 && (
        <>
          {/* Actions bar */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by email, model, type, or ID..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => exportToCSV(records)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Download size={16} />
                Export CSV
              </button>
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to clear all data? This cannot be undone.')) {
                    clearRecords();
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Trash2 size={16} />
                Clear All
              </button>
            </div>
          </div>

          <p className="text-sm text-gray-500">{formatNumber(filtered.length)} records {search && `(filtered from ${formatNumber(records.length)})`}</p>

          {/* Table */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                    <th
                      onClick={() => toggleSort('time')}
                      className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                    >
                      Time{sortIndicator('time')}
                    </th>
                    <th
                      onClick={() => toggleSort('email')}
                      className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                    >
                      Email{sortIndicator('email')}
                    </th>
                    <th
                      onClick={() => toggleSort('credits')}
                      className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                    >
                      Credits{sortIndicator('credits')}
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Model</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Generations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {pageData.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-2.5 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                        {format(parseISO(r.time), 'MMM d, yyyy HH:mm')}
                      </td>
                      <td className="px-4 py-2.5 text-sm text-gray-900 dark:text-white">{r.email}</td>
                      <td className="px-4 py-2.5 text-sm text-right font-medium text-indigo-600">{r.credits}</td>
                      <td className="px-4 py-2.5 text-sm text-gray-600 dark:text-gray-300">{r.modelName}</td>
                      <td className="px-4 py-2.5 text-sm text-gray-600 dark:text-gray-300">{r.type.replace(/_/g, ' ')}</td>
                      <td className="px-4 py-2.5 text-sm text-right text-gray-600 dark:text-gray-300">{r.numberOfGenerations}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Previous
              </button>
              <span className="text-sm text-gray-500">
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
