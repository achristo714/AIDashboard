import { useState } from 'react';
import { Info } from 'lucide-react';

interface Props {
  title: string;
  tooltip?: string;
}

export default function ChartHeader({ title, tooltip }: Props) {
  const [show, setShow] = useState(false);

  return (
    <div className="flex items-center gap-2 mb-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
      {tooltip && (
        <div
          className="relative"
          onMouseEnter={() => setShow(true)}
          onMouseLeave={() => setShow(false)}
        >
          <Info size={15} className="text-gray-400 dark:text-gray-500 cursor-help" />
          {show && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg shadow-lg z-50 leading-relaxed">
              {tooltip}
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
