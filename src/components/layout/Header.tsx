import { useGenerationStore } from '../../store/generationStore';
import { useFilteredRecords } from '../../hooks/useFilteredRecords';
import { formatNumber } from '../../utils/formatters';
import { Upload, Moon, Sun } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DateRangeSelector from '../filters/DateRangeSelector';

export default function Header() {
  const { records, darkMode, setDarkMode, datePreset } = useGenerationStore();
  const filtered = useFilteredRecords();
  const navigate = useNavigate();

  const showingFiltered = datePreset !== 'all' && filtered.length !== records.length;

  return (
    <header className="h-16 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex items-center justify-between px-6 shrink-0">
      <div className="text-sm text-gray-500 dark:text-gray-400">
        {records.length > 0 ? (
          <span>
            {showingFiltered
              ? `${formatNumber(filtered.length)} of ${formatNumber(records.length)} records`
              : `${formatNumber(records.length)} records loaded`
            }
          </span>
        ) : (
          <span>No data loaded - upload a CSV to get started</span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <DateRangeSelector />
        <button
          onClick={() => navigate('/data')}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Upload size={16} />
          Upload CSV
        </button>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
}
