import { useGenerationStore } from '../store/generationStore';

export function useChartTheme() {
  const darkMode = useGenerationStore((s) => s.darkMode);

  return {
    gridColor: darkMode ? '#374151' : '#e5e7eb',
    tickColor: darkMode ? '#9ca3af' : '#6b7280',
    tooltipStyle: {
      borderRadius: '8px',
      border: darkMode ? '1px solid #4b5563' : '1px solid #e5e7eb',
      backgroundColor: darkMode ? '#1f2937' : '#ffffff',
      color: darkMode ? '#e5e7eb' : '#1f2937',
    },
    gaugeEmpty: darkMode ? '#374151' : '#e5e7eb',
    heatmapEmpty: darkMode ? '#1f2937' : '#f1f5f9',
  };
}
