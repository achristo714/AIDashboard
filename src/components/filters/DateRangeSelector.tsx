import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { useGenerationStore, type DatePreset } from '../../store/generationStore';

const PRESETS: { value: DatePreset; label: string }[] = [
  { value: 'all', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: 'last7', label: 'Last 7 Days' },
  { value: 'last30', label: 'Last 30 Days' },
  { value: 'thisMonth', label: 'This Month' },
  { value: 'lastMonth', label: 'Last Month' },
  { value: 'thisQuarter', label: 'This Quarter' },
  { value: 'custom', label: 'Custom Range' },
];

export default function DateRangeSelector() {
  const { datePreset, customDateStart, customDateEnd, setDatePreset, setCustomDateRange } = useGenerationStore();
  const [open, setOpen] = useState(false);
  const [tempStart, setTempStart] = useState(customDateStart || '');
  const [tempEnd, setTempEnd] = useState(customDateEnd || '');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const currentLabel = PRESETS.find((p) => p.value === datePreset)?.label || 'All Time';

  const handlePreset = (preset: DatePreset) => {
    if (preset === 'custom') {
      setDatePreset('custom');
    } else {
      setDatePreset(preset);
      setOpen(false);
    }
  };

  const handleApplyCustom = () => {
    if (tempStart && tempEnd) {
      setCustomDateRange(tempStart, tempEnd);
      setOpen(false);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <Calendar size={14} />
        <span>{currentLabel}</span>
        {datePreset === 'custom' && customDateStart && customDateEnd && (
          <span className="text-gray-400 text-xs">({customDateStart} - {customDateEnd})</span>
        )}
        <ChevronDown size={14} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="p-1">
            {PRESETS.filter((p) => p.value !== 'custom').map((preset) => (
              <button
                key={preset.value}
                onClick={() => handlePreset(preset.value)}
                className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                  datePreset === preset.value
                    ? 'bg-indigo-500 text-white'
                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700 p-3 space-y-2">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Custom Range</p>
            <div className="flex gap-2">
              <input
                type="date"
                value={tempStart}
                onChange={(e) => setTempStart(e.target.value)}
                className="flex-1 px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200"
              />
              <input
                type="date"
                value={tempEnd}
                onChange={(e) => setTempEnd(e.target.value)}
                className="flex-1 px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200"
              />
            </div>
            <button
              onClick={handleApplyCustom}
              disabled={!tempStart || !tempEnd}
              className="w-full px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
