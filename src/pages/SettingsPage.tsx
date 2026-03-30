import { useState } from 'react';
import { useGenerationStore } from '../store/generationStore';
import { formatNumber } from '../utils/formatters';
import { Plus, Trash2, Moon, Sun } from 'lucide-react';
import type { SpendTarget } from '../types/generation';

export default function SettingsPage() {
  const { targets, addTarget, removeTarget, darkMode, setDarkMode, records } = useGenerationStore();
  const [newTarget, setNewTarget] = useState<{ period: 'monthly' | 'quarterly'; amount: string; email: string }>({ period: 'monthly', amount: '', email: '' });

  const handleAddTarget = () => {
    const amount = parseFloat(newTarget.amount);
    if (isNaN(amount) || amount <= 0) return;

    const target: SpendTarget = {
      id: crypto.randomUUID(),
      period: newTarget.period,
      amount,
      email: newTarget.email || undefined,
    };
    addTarget(target);
    setNewTarget({ period: 'monthly', amount: '', email: '' });
  };

  const uniqueEmails = [...new Set(records.map((r) => r.email))].sort();

  return (
    <div className="space-y-6 max-w-3xl">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h2>

      {/* Appearance */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Appearance</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-700 dark:text-gray-200">Dark Mode</p>
            <p className="text-sm text-gray-500">Switch between light and dark themes</p>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`relative w-14 h-7 rounded-full transition-colors ${darkMode ? 'bg-indigo-500' : 'bg-gray-300'}`}
          >
            <span
              className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform flex items-center justify-center ${
                darkMode ? 'translate-x-7' : 'translate-x-0.5'
              }`}
            >
              {darkMode ? <Moon size={12} className="text-indigo-500" /> : <Sun size={12} className="text-amber-500" />}
            </span>
          </button>
        </div>
      </div>

      {/* Credit Targets */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Credit Targets</h3>
        <p className="text-sm text-gray-500 mb-4">
          Set monthly or quarterly credit targets to track against on the projections page.
        </p>

        {/* Existing targets */}
        {targets.length > 0 && (
          <div className="space-y-2 mb-4">
            {targets.map((t) => (
              <div key={t.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-lg px-4 py-3">
                <div>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatNumber(t.amount)} credits
                  </span>
                  <span className="text-sm text-gray-500 ml-2">/ {t.period}</span>
                  {t.email && <span className="text-sm text-indigo-500 ml-2">({t.email})</span>}
                </div>
                <button
                  onClick={() => removeTarget(t.id)}
                  className="p-1.5 text-red-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add new target */}
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Period</label>
            <select
              value={newTarget.period}
              onChange={(e) => setNewTarget((s) => ({ ...s, period: e.target.value as 'monthly' | 'quarterly' }))}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
            >
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Credits Target</label>
            <input
              type="number"
              value={newTarget.amount}
              onChange={(e) => setNewTarget((s) => ({ ...s, amount: e.target.value }))}
              placeholder="e.g. 10000"
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 w-36"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">User (optional)</label>
            <select
              value={newTarget.email}
              onChange={(e) => setNewTarget((s) => ({ ...s, email: e.target.value }))}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
            >
              <option value="">All users</option>
              {uniqueEmails.map((email) => (
                <option key={email} value={email}>{email}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleAddTarget}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus size={16} />
            Add Target
          </button>
        </div>
      </div>

      {/* Data Info */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Data Info</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Total Records</span>
            <span className="font-medium text-gray-900 dark:text-white">{formatNumber(records.length)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Unique Users</span>
            <span className="font-medium text-gray-900 dark:text-white">{new Set(records.map((r) => r.email)).size}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Unique Models</span>
            <span className="font-medium text-gray-900 dark:text-white">{new Set(records.map((r) => r.modelName)).size}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Storage</span>
            <span className="font-medium text-gray-900 dark:text-white">IndexedDB (local browser)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
