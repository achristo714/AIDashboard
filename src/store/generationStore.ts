import { create } from 'zustand';
import { get as idbGet, set as idbSet } from 'idb-keyval';
import type { GenerationRecord, AnomalyFlag, SpendTarget } from '../types/generation';

interface GenerationState {
  records: GenerationRecord[];
  anomalies: AnomalyFlag[];
  targets: SpendTarget[];
  isLoading: boolean;
  lastUploadAt: string | null;
  darkMode: boolean;

  setRecords: (records: GenerationRecord[]) => void;
  addRecords: (newRecords: GenerationRecord[]) => void;
  clearRecords: () => void;
  setAnomalies: (anomalies: AnomalyFlag[]) => void;
  dismissAnomaly: (recordId: string) => void;
  setTargets: (targets: SpendTarget[]) => void;
  addTarget: (target: SpendTarget) => void;
  removeTarget: (id: string) => void;
  setDarkMode: (dark: boolean) => void;
  loadFromStorage: () => Promise<void>;
}

export const useGenerationStore = create<GenerationState>((set, get) => ({
  records: [],
  anomalies: [],
  targets: [],
  isLoading: false,
  lastUploadAt: null,
  darkMode: false,

  setRecords: (records) => {
    set({ records, lastUploadAt: new Date().toISOString() });
    idbSet('xfigura-records', records);
  },

  addRecords: (newRecords) => {
    const existing = get().records;
    const existingIds = new Set(existing.map((r) => r.id));
    const unique = newRecords.filter((r) => !existingIds.has(r.id));
    const merged = [...existing, ...unique];
    set({ records: merged, lastUploadAt: new Date().toISOString() });
    idbSet('xfigura-records', merged);
  },

  clearRecords: () => {
    set({ records: [], anomalies: [], lastUploadAt: null });
    idbSet('xfigura-records', []);
  },

  setAnomalies: (anomalies) => {
    set({ anomalies });
    idbSet('xfigura-anomalies', anomalies);
  },

  dismissAnomaly: (recordId) => {
    const anomalies = get().anomalies.map((a) =>
      a.recordId === recordId ? { ...a, dismissed: true } : a
    );
    set({ anomalies });
    idbSet('xfigura-anomalies', anomalies);
  },

  setTargets: (targets) => {
    set({ targets });
    localStorage.setItem('xfigura-targets', JSON.stringify(targets));
  },

  addTarget: (target) => {
    const targets = [...get().targets, target];
    set({ targets });
    localStorage.setItem('xfigura-targets', JSON.stringify(targets));
  },

  removeTarget: (id) => {
    const targets = get().targets.filter((t) => t.id !== id);
    set({ targets });
    localStorage.setItem('xfigura-targets', JSON.stringify(targets));
  },

  setDarkMode: (darkMode) => {
    set({ darkMode });
    localStorage.setItem('xfigura-darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  },

  loadFromStorage: async () => {
    set({ isLoading: true });
    try {
      const records = await idbGet<GenerationRecord[]>('xfigura-records');
      const anomalies = await idbGet<AnomalyFlag[]>('xfigura-anomalies');
      const targetsJson = localStorage.getItem('xfigura-targets');
      const darkModeJson = localStorage.getItem('xfigura-darkMode');

      set({
        records: records || [],
        anomalies: anomalies || [],
        targets: targetsJson ? JSON.parse(targetsJson) : [],
        darkMode: darkModeJson ? JSON.parse(darkModeJson) : false,
        isLoading: false,
      });

      if (darkModeJson && JSON.parse(darkModeJson)) {
        document.documentElement.classList.add('dark');
      }
    } catch {
      set({ isLoading: false });
    }
  },
}));
