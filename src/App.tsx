import React, { useEffect } from 'react';
import { SideNav } from './components/layout/SideNav';
import { DashboardCockpit } from './components/cockpit/DashboardCockpit';
import { ClassesStudentsHub } from './components/hub/ClassesStudentsHub';
import { LessonPlannerHub } from './components/hub/LessonPlannerHub';
import { ClaimsReportsHub } from './components/hub/ClaimsReportsHub';
import { SettingsHub } from './components/hub/SettingsHub';
import { useTeacherStore } from './store/useTeacherStore';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { ToastContainer } from './components/common/ToastContainer';
import { ClassroomClock } from './components/common/ClassroomClock';
import { SyncStatusBadge } from './components/layout/SyncStatusBadge';

export const App: React.FC = () => {
  const { activeTab, language, fetchDatabaseFromEdge, refreshNotifications } = useTeacherStore();

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

    // Keep time-based alerts ("class starts at 14:30", overdue tasks) fresh.
    const alertTimer = setInterval(refreshNotifications, 60_000);

    return () => {
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
      <div className="min-h-screen bg-[#F6F4EF] text-[#1E293B] font-sans flex flex-row selection:bg-teal-100 selection:text-teal-900">
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
              <ClassroomClock compact />
            </div>
          </header>

          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 pb-20 md:pb-8">
            {activeTab === 'cockpit' && <DashboardCockpit />}
            {activeTab === 'classes-students' && <ClassesStudentsHub />}
            {activeTab === 'lesson-planner' && <LessonPlannerHub />}
            {activeTab === 'claims-reports' && <ClaimsReportsHub />}
            {activeTab === 'settings' && <SettingsHub />}
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default App;
