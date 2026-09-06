import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { TodayPage } from './pages/TodayPage';
import { LogFoodPage } from './pages/LogFoodPage';

/**
 * Today and Log food stay in the initial bundle: Today is the landing screen
 * and Log food is the action taken from it, and the two share most of their
 * components anyway, so splitting them would buy a round trip on the most
 * common interaction in the app.
 *
 * Everything else is loaded on demand. History is the only screen that needs
 * Recharts, the largest dependency in the project, and Settings pulls in the
 * whole backup and import path. Neither belongs in the first download.
 */
const HistoryPage = lazy(() =>
  import('./pages/HistoryPage').then((m) => ({ default: m.HistoryPage })),
);
const SettingsPage = lazy(() =>
  import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage })),
);
const PrivacyPage = lazy(() =>
  import('./pages/PrivacyPage').then((m) => ({ default: m.PrivacyPage })),
);
const NotFoundPage = lazy(() =>
  import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })),
);

/**
 * Held at a fixed height so swapping a lazy route in does not shift the page
 * under the reader. It is announced politely rather than assertively because
 * a route change is expected, not urgent.
 */
function RouteFallback() {
  return (
    <p role="status" className="flex min-h-64 items-center justify-center text-sm text-ink-3">
      Loading.
    </p>
  );
}

function lazyRoute(element: React.ReactNode) {
  return <Suspense fallback={<RouteFallback />}>{element}</Suspense>;
}

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<TodayPage />} />
        <Route path="log" element={<LogFoodPage />} />
        <Route path="history" element={lazyRoute(<HistoryPage />)} />
        <Route path="settings" element={lazyRoute(<SettingsPage />)} />
        <Route path="privacy" element={lazyRoute(<PrivacyPage />)} />
        {/* A real not-found screen. Redirecting unknown paths to Today would
            quietly pretend the visitor asked for the home page. */}
        <Route path="*" element={lazyRoute(<NotFoundPage />)} />
      </Route>
    </Routes>
  );
}
