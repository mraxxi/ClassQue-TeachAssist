import React from 'react';
import { SideNav } from './components/layout/SideNav';
import { DashboardCockpit } from './components/cockpit/DashboardCockpit';
import { ClassesStudentsHub } from './components/hub/ClassesStudentsHub';
import { LessonPlannerHub } from './components/hub/LessonPlannerHub';
import { ClaimsReportsHub } from './components/hub/ClaimsReportsHub';
import { SettingsHub } from './components/hub/SettingsHub';
import { useTeacherStore } from './store/useTeacherStore';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { ToastContainer } from './components/common/ToastContainer';

export const App: React.FC = () => {
  const { activeTab } = useTeacherStore();

  return (
    <ErrorBoundary>
      <ToastContainer />
      <div className="min-h-screen bg-[#F6F4EF] flex flex-col md:flex-row selection:bg-teal-100 selection:text-teal-900 pb-16 md:pb-0">
        {/* Left Master Navigation Sidebar */}
        <SideNav />

        {/* Main Responsive Canvas */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          {activeTab === 'cockpit' && <DashboardCockpit />}
          {activeTab === 'classes-students' && <ClassesStudentsHub />}
          {activeTab === 'lesson-planner' && <LessonPlannerHub />}
          {activeTab === 'claims-reports' && <ClaimsReportsHub />}
          {activeTab === 'settings' && <SettingsHub />}
        </main>
      </div>
    </ErrorBoundary>
  );
};

export default App;
