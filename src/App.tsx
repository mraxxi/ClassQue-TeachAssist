import React, { Suspense, lazy, useEffect } from 'react';
import { SideNav } from './components/layout/SideNav';
import { DashboardCockpit } from './components/cockpit/DashboardCockpit';
import { useTeacherStore } from './store/useTeacherStore';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { ToastContainer } from './components/common/ToastContainer';
import { ClassroomClock } from './components/common/ClassroomClock';
import { SyncStatusBadge } from './components/layout/SyncStatusBadge';
import { applyTheme, watchSystemTheme } from './utils/theme';
import { useTranslation } from './utils/i18n';
import { ShortcutsDialog } from './components/common/ShortcutsDialog';
import { Keyboard } from 'lucide-react';

// Secondary hubs are split out of the first load; they are preloaded when the browser is idle so they are
// also in the service-worker cache (open offline) before the teacher first needs them.
const loaders = {
  classes: () => import('./components/hub/ClassesStudentsHub'),
  lessons: () => import('./components/hub/LessonPlannerHub'),
  claims: () => import('./components/hub/ClaimsReportsHub'),
  settings: () => import('./components/hub/SettingsHub'),
};
const ClassesStudentsHub = lazy(() => loaders.classes().then((m) => ({ default: m.ClassesStudentsHub })));
const LessonPlannerHub = lazy(() => loaders.lessons().then((m) => ({ default: m.LessonPlannerHub })));
const ClaimsReportsHub = lazy(() => loaders.claims().then((m) => ({ default: m.ClaimsReportsHub })));
const SettingsHub = lazy(() => loaders.settings().then((m) => ({ default: m.SettingsHub })));

const HubFallback: React.FC = () => (
  <div className="space-y-4 animate-pulse motion-reduce:animate-none" role="status" aria-label="Loading">
    <div className="h-24 rounded-3xl bg-stone-200/70" />
    <div className="h-64 rounded-3xl bg-stone-200/50" />
  </div>
);

export const App: React.FC = () => {
  const [shortcutsOpen, setShortcutsOpen] = React.useState(false);
  const { activeTab, language, fetchDatabaseFromEdge, refreshNotifications } = useTeacherStore();
  const nav = useTranslation(language).nav;
  const pageTitle = { cockpit: nav.cockpit, 'classes-students': nav.classesStudents, 'lesson-planner': nav.lessonPlanner, 'claims-reports': nav.claimsReports, settings: nav.settings }[activeTab];

  useEffect(() => {
    // Fetch initial dataset from Cloudflare D1 Edge database on load
    fetchDatabaseFromEdge();

    // Reconnection listener: automatically flush pending local changes when back online
    const handleOnline = () => {
      fetchDatabaseFromEdge();
    };
    const handleOffline = () => {
      useTeacherStore.setState({ isEdgeConnected: false });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Multi-device freshness: pull (incrementally) when the tab becomes visible and once a minute while it is.
    let lastPull = Date.now();
    const pullIfStale = () => {
      if (document.visibilityState !== 'visible' || !navigator.onLine || Date.now() - lastPull < 20_000) return;
      lastPull = Date.now();
      void fetchDatabaseFromEdge();
    };
    document.addEventListener('visibilitychange', pullIfStale);
    const pullTimer = setInterval(pullIfStale, 60_000);

    // Theme: make sure <html> matches the preference, and follow the OS while it is "system".
    applyTheme(useTeacherStore.getState().theme);
    const stopWatchingTheme = watchSystemTheme(() => useTeacherStore.getState().theme);

    // "?" opens the shortcut help (ignored while typing in a field).
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (e.key !== '?' || e.ctrlKey || e.metaKey || e.altKey) return;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable)) return;
      e.preventDefault();
      setShortcutsOpen((o) => !o);
    };
    window.addEventListener('keydown', onKey);

    // Warm the lazy chunks once the browser is idle.
    const idle = (window as any).requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 1500));
    idle(() => Object.values(loaders).forEach((load) => void load().catch(() => undefined)));

    // Keep time-based alerts ("class starts at 14:30", overdue tasks) fresh.
    const alertTimer = setInterval(refreshNotifications, 60_000);

    return () => {
      window.removeEventListener('keydown', onKey);
      stopWatchingTheme();
      clearInterval(alertTimer);
      clearInterval(pullTimer);
      document.removeEventListener('visibilitychange', pullIfStale);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [fetchDatabaseFromEdge, refreshNotifications]);

  return (
    <ErrorBoundary>
      <ToastContainer />
      <ShortcutsDialog isOpen={shortcutsOpen} onClose={() => setShortcutsOpen(false)} language={language} />
      <div className="min-h-screen bg-(--app-bg) text-(--app-fg) font-sans flex flex-row selection:bg-teal-100 selection:text-teal-900">
        {/* Left Master Navigation Sidebar */}
        <SideNav />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
          {/* Persistent Top Utility Bar with Live Clock & Edge Sync Status */}
          <header className="hidden md:flex items-center justify-between px-8 py-2.5 bg-white/60 backdrop-blur-sm border-b border-stone-200/50 sticky top-0 z-30">
            <div className="flex items-center gap-2 text-xs font-medium text-stone-500">
              <span className="w-2 h-2 rounded-full bg-teal-600"></span>
              <span>Teaching Session Workspace</span>
            </div>
            <div className="flex items-center gap-3">
              <SyncStatusBadge language={language} />
              <button
                onClick={() => setShortcutsOpen(true)}
                aria-label={language === 'id' ? 'Pintasan keyboard (?)' : 'Keyboard shortcuts (?)'}
                title={language === 'id' ? 'Pintasan keyboard (?)' : 'Keyboard shortcuts (?)'}
                className="p-1.5 rounded-lg text-stone-600 hover:bg-stone-100 cursor-pointer focus-visible:outline-2 focus-visible:outline-teal-700"
              >
                <Keyboard className="w-4 h-4" />
              </button>
              <ClassroomClock compact />
            </div>
          </header>

          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 pb-20 md:pb-8">
            {activeTab === 'cockpit' && <DashboardCockpit />}
            <h1 className="sr-only">{pageTitle}</h1>
            <Suspense fallback={<HubFallback />}>
              {activeTab === 'classes-students' && <ClassesStudentsHub />}
              {activeTab === 'lesson-planner' && <LessonPlannerHub />}
              {activeTab === 'claims-reports' && <ClaimsReportsHub />}
              {activeTab === 'settings' && <SettingsHub />}
            </Suspense>
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default App;
