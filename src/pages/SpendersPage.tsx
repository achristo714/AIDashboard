import { useMemo, useState } from 'react';
import { useFilteredRecords } from '../hooks/useFilteredRecords';
import { aggregateByUser } from '../utils/aggregations';
import { formatNumber, formatCredits } from '../utils/formatters';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { CHART_COLORS } from '../constants/chartColors';

export default function SpendersPage() {
  const records = useFilteredRecords();
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const userAgg = useMemo(() => aggregateByUser(records), [records]);

  const selectedData = useMemo(
    () => userAgg.find((u) => u.email === selectedUser),
    [userAgg, selectedUser]
  );

  if (records.length === 0) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-gray-400">
        Upload data to see top spenders
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Top Spenders</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Spenders list */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rank</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Credits</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Requests</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Generations</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Avg/Req</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-24">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {(() => {
                const top100 = userAgg.slice(0, 100);
                const maxCredits = top100[0]?.totalCredits || 1;
                return top100.map((user, idx) => (
                  <tr
                    key={user.email}
                    onClick={() => setSelectedUser(user.email === selectedUser ? null : user.email)}
                    className={`cursor-pointer transition-colors ${
                      selectedUser === user.email
                        ? 'bg-indigo-50 dark:bg-indigo-900/20'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <td className="px-4 py-2 text-sm text-gray-400 font-mono">#{idx + 1}</td>
                    <td className="px-4 py-2 text-sm font-medium text-gray-900 dark:text-white">{user.email}</td>
                    <td className="px-4 py-2 min-w-[200px]">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${(user.totalCredits / maxCredits) * 100}%`,
                              backgroundColor: CHART_COLORS[idx % CHART_COLORS.length],
                              opacity: 0.7,
                            }}
                          />
                        </div>
                        <span className="text-sm font-semibold shrink-0 w-14 text-right" style={{ color: CHART_COLORS[idx % CHART_COLORS.length] }}>
                          {formatCredits(user.totalCredits)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-sm text-right text-gray-600 dark:text-gray-300">{formatNumber(user.totalRequests)}</td>
                    <td className="px-4 py-2 text-sm text-right text-gray-600 dark:text-gray-300">{formatNumber(user.totalGenerations)}</td>
                    <td className="px-4 py-2 text-sm text-right text-gray-600 dark:text-gray-300">{user.avgCreditsPerRequest.toFixed(1)}</td>
                    <td className="px-4 py-2">
                      <ResponsiveContainer width={80} height={28}>
                        <LineChart data={user.dailyCredits}>
                          <Line
                            type="monotone"
                            dataKey="credits"
                            stroke={CHART_COLORS[idx % CHART_COLORS.length]}
                            strokeWidth={1.5}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </td>
                  </tr>
                ));
              })()}
              </tbody>
            </table>
          </div>
        </div>

        {/* User detail panel */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          {selectedData ? (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white text-lg truncate">{selectedData.email}</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Total Credits</p>
                  <p className="text-lg font-bold text-indigo-600">{formatCredits(selectedData.totalCredits)}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Requests</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{formatNumber(selectedData.totalRequests)}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Generations</p>
                  <p className="text-lg font-bold text-amber-500">{formatNumber(selectedData.totalGenerations)}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Avg Credits/Req</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{selectedData.avgCreditsPerRequest.toFixed(1)}</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Models Used</h4>
                <div className="space-y-1">
                  {Object.entries(selectedData.models)
                    .sort(([, a], [, b]) => b - a)
                    .map(([model, credits]) => (
                      <div key={model} className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">{model}</span>
                        <span className="font-medium text-gray-900 dark:text-white">{formatCredits(credits)}</span>
                      </div>
                    ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Generation Types</h4>
                <div className="space-y-1">
                  {Object.entries(selectedData.types)
                    .sort(([, a], [, b]) => b - a)
                    .map(([type, credits]) => (
                      <div key={type} className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">{type}</span>
                        <span className="font-medium text-gray-900 dark:text-white">{formatCredits(credits)}</span>
                      </div>
                    ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Daily Usage</h4>
                <ResponsiveContainer width="100%" height={150}>
                  <LineChart data={selectedData.dailyCredits}>
                    <Line type="monotone" dataKey="credits" stroke="#6366f1" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              Click a user to see details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
