import { useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import DashboardLayout from './components/layout/DashboardLayout';
import DashboardPage from './pages/DashboardPage';
import SpendersPage from './pages/SpendersPage';
import GenerationsPage from './pages/GenerationsPage';
import ProjectionsPage from './pages/ProjectionsPage';
import AnomaliesPage from './pages/AnomaliesPage';
import DataPage from './pages/DataPage';
import SettingsPage from './pages/SettingsPage';
import { useGenerationStore } from './store/generationStore';

export default function App() {
  const loadFromStorage = useGenerationStore((s) => s.loadFromStorage);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  return (
    <HashRouter>
      <Routes>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/spenders" element={<SpendersPage />} />
          <Route path="/generations" element={<GenerationsPage />} />
          <Route path="/projections" element={<ProjectionsPage />} />
          <Route path="/anomalies" element={<AnomaliesPage />} />
          <Route path="/data" element={<DataPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
