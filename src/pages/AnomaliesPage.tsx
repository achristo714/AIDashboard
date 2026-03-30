import { useMemo, useState } from 'react';
import { useGenerationStore } from '../store/generationStore';
import { detectAnomalies } from '../utils/anomalyDetection';
import AnomalyScatter from '../components/charts/AnomalyScatter';
import { AlertTriangle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

type SeverityFilter = 'all' | 'high' | 'medium' | 'low';
type StatusFilter = 'active' | 'dismissed' | 'all';

export default function AnomaliesPage() {
  const { records, anomalies, setAnomalies, dismissAnomaly } = useGenerationStore();
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');

  const filtered = useMemo(() => {
    return anomalies.filter((a) => {
      if (severityFilter !== 'all' && a.severity !== severityFilter) return false;
      if (statusFilter === 'active' && a.dismissed) return false;
      if (statusFilter === 'dismissed' && !a.dismissed) return false;
      return true;
    });
  }, [anomalies, severityFilter, statusFilter]);

  const counts = useMemo(() => ({
    total: anomalies.length,
    active: anomalies.filter((a) => !a.dismissed).length,
    high: anomalies.filter((a) => a.severity === 'high' && !a.dismissed).length,
    medium: anomalies.filter((a) => a.severity === 'medium' && !a.dismissed).length,
    low: anomalies.filter((a) => a.severity === 'low' && !a.dismissed).length,
  }), [anomalies]);

  const rerunDetection = () => {
    const newAnomalies = detectAnomalies(records);
    setAnomalies(newAnomalies);
  };

  if (records.length === 0) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-gray-400">
        Upload data to run anomaly detection
      </div>
    );
  }

  const severityColors = {
    high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    low: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  };

  const typeLabels: Record<string, string> = {
    duplicate: 'Duplicate',
    outlier: 'Outlier',
    missing_data: 'Missing Data',
    date_anomaly: 'Date Issue',
    spike: 'Usage Spike',
    suspicious_frequency: 'Suspicious',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Anomalies</h2>
        <button
          onClick={rerunDetection}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <RefreshCw size={16} />
          Re-run Detection
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 text-gray-500">
            <AlertTriangle size={16} />
            <span className="text-sm">Active</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{counts.active}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-red-200 dark:border-red-700 p-4">
          <div className="flex items-center gap-2 text-red-500">
            <XCircle size={16} />
            <span className="text-sm">High</span>
          </div>
          <p className="text-2xl font-bold text-red-600 mt-1">{counts.high}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-amber-200 dark:border-amber-700 p-4">
          <div className="flex items-center gap-2 text-amber-500">
            <AlertTriangle size={16} />
            <span className="text-sm">Medium</span>
          </div>
          <p className="text-2xl font-bold text-amber-600 mt-1">{counts.medium}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-blue-200 dark:border-blue-700 p-4">
          <div className="flex items-center gap-2 text-blue-500">
            <CheckCircle size={16} />
            <span className="text-sm">Low</span>
          </div>
          <p className="text-2xl font-bold text-blue-600 mt-1">{counts.low}</p>
        </div>
      </div>

      {/* Scatter chart */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Anomaly Distribution</h3>
        <AnomalyScatter records={records} anomalies={anomalies} />
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-center">
        <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-0.5">
          {(['all', 'high', 'medium', 'low'] as SeverityFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setSeverityFilter(s)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors capitalize ${
                severityFilter === s
                  ? 'bg-indigo-500 text-white'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-0.5">
          {(['active', 'dismissed', 'all'] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors capitalize ${
                statusFilter === s
                  ? 'bg-indigo-500 text-white'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Anomaly table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Severity</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Message</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Record ID</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                    {anomalies.length === 0 ? 'No anomalies detected' : 'No anomalies match current filters'}
                  </td>
                </tr>
              ) : (
                filtered.map((a, idx) => (
                  <tr key={`${a.recordId}-${idx}`} className={a.dismissed ? 'opacity-50' : ''}>
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                        {typeLabels[a.type] || a.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${severityColors[a.severity]}`}>
                        {a.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 max-w-md truncate">{a.message}</td>
                    <td className="px-4 py-3 text-xs font-mono text-gray-400 max-w-[200px] truncate">{a.recordId}</td>
                    <td className="px-4 py-3">
                      {!a.dismissed && (
                        <button
                          onClick={() => dismissAnomaly(a.recordId)}
                          className="text-xs text-gray-500 hover:text-indigo-600 font-medium"
                        >
                          Dismiss
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
