import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { TodayPage } from './pages/TodayPage';
import { LogFoodPage } from './pages/LogFoodPage';
import { SettingsPage } from './pages/SettingsPage';
import { PrivacyPage } from './pages/PrivacyPage';

/**
 * History is loaded on demand because it is the only screen that needs
 * Recharts, which is the single largest dependency in the project. Everything
 * is bundled locally rather than pulled from a CDN, so keeping the charting
 * library out of the initial download is worth a route split.
 */
const HistoryPage = lazy(() =>
  import('./pages/HistoryPage').then((module) => ({ default: module.HistoryPage })),
);

function RouteFallback() {
  return (
    <p role="status" className="py-10 text-center text-sm text-ink-3">
      Loading.
    </p>
  );
}

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<TodayPage />} />
        <Route path="log" element={<LogFoodPage />} />
        <Route
          path="history"
          element={
            <Suspense fallback={<RouteFallback />}>
              <HistoryPage />
            </Suspense>
          }
        />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="privacy" element={<PrivacyPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
