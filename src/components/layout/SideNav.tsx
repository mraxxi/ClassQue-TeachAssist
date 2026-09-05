import React, { useState } from 'react';
import { 
  BookOpen, LayoutDashboard, Users, FileText, 
  ReceiptText, Settings, Bell, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useTeacherStore } from '../../store/facade';
import { useTranslation } from '../../utils/i18n';
import { SyncStatusBadge } from './SyncStatusBadge';
import { NotificationsPopover } from './NotificationsPopover';
import { getCookie, setCookie, COOKIE_KEYS } from '../../utils/cookies';

export const SideNav: React.FC = () => {
  const { activeTab, setActiveTab, language, setLanguage, teacher, notifications } = useTeacherStore();
  const t = useTranslation(language);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(() => {
    const savedCookie = getCookie(COOKIE_KEYS.SIDEBAR_EXPANDED);
    if (savedCookie !== null) return savedCookie === 'true';
    return true;
  });

  const unreadNotifCount = notifications.filter((n) => !n.isRead).length;

  const handleToggleExpand = () => {
    const nextState = !isExpanded;
    setIsExpanded(nextState);
    setCookie(COOKIE_KEYS.SIDEBAR_EXPANDED, String(nextState));
  };

  const navItems = [
    { id: 'cockpit' as const, label: t.nav.cockpit, icon: LayoutDashboard },
    { id: 'classes-students' as const, label: t.nav.classesStudents, icon: Users },
    { id: 'lesson-planner' as const, label: t.nav.lessonPlanner, icon: FileText },
    { id: 'claims-reports' as const, label: t.nav.claimsReports, icon: ReceiptText },
    { id: 'settings' as const, label: t.nav.settings, icon: Settings },
  ];

  return (
    <>
      {/* Desktop Left Sidebar */}
      <aside className={`hidden md:flex flex-col justify-between sticky top-0 left-0 h-screen self-start shrink-0 bg-white/95 backdrop-blur-md border-r border-stone-200/80 shadow-xs transition-all duration-300 z-40 select-none overflow-y-auto ${isExpanded ? 'w-64' : 'w-20'}`}>
        <div className="flex items-center justify-between p-4 border-b border-stone-200/60">
          <div className="flex items-center gap-3 cursor-pointer overflow-hidden" onClick={() => setActiveTab('cockpit')}>
            <div className="w-10 h-10 shrink-0 rounded-xl bg-teal-800 flex items-center justify-center text-white shadow-xs">
              <BookOpen className="w-5 h-5 text-teal-200" />
            </div>
            {isExpanded && (
              <div className="whitespace-nowrap transition-opacity duration-300">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-lg text-stone-900 tracking-tight">{t.brandName}</span>
                </div>
                <p className="text-[11px] text-stone-500 font-medium -mt-0.5">{t.brandSubtitle}</p>
              </div>
            )}
          </div>
        </div>

        {/* Toggle Collapse Button */}
        <button 
          onClick={handleToggleExpand}
          className="absolute -right-3 top-6 bg-white border border-stone-200 rounded-full p-1 text-stone-500 hover:text-teal-700 shadow-sm z-50 cursor-pointer"
        >
          {isExpanded ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1.5 scrollbar-hide">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                title={!isExpanded ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-teal-50/80 text-teal-900 shadow-xs border border-teal-100/50'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/70'
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-teal-700' : 'text-stone-400'}`} />
                {isExpanded && <span className="whitespace-nowrap">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-stone-200/60 flex flex-col gap-4">
          <div className={`flex items-center ${isExpanded ? 'justify-between' : 'justify-center flex-col gap-3'}`}>
            <SyncStatusBadge language={language} compact={!isExpanded} />
            <div className="flex items-center gap-2">
              <button
                onClick={() => setLanguage(language === 'id' ? 'en' : 'id')}
                className="flex items-center justify-center w-8 h-8 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 transition-colors cursor-pointer"
                title="Ganti Bahasa / Switch Language"
              >
                <span className="text-[10px] font-bold">{language.toUpperCase()}</span>
              </button>
              <div className="relative">
                <button 
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                  className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors relative cursor-pointer ${
                    isNotifOpen 
                      ? 'bg-teal-100 text-teal-800' 
                      : 'text-stone-500 hover:text-stone-700 hover:bg-stone-100'
                  }`}
                  title={language === 'id' ? 'Pusat Notifikasi' : 'Notifications'}
                >
                  <Bell className="w-4 h-4" />
                  {unreadNotifCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
                  )}
                </button>
                <NotificationsPopover 
                  isOpen={isNotifOpen} 
                  onClose={() => setIsNotifOpen(false)} 
                />
              </div>
            </div>
          </div>

          <div 
            className={`flex items-center gap-3 cursor-pointer p-2 rounded-xl hover:bg-stone-100 transition-colors ${!isExpanded && 'justify-center'}`}
            onClick={() => setActiveTab('settings')}
            title={!isExpanded ? teacher?.name : undefined}
          >
            <div className="w-9 h-9 shrink-0 rounded-full bg-gradient-to-tr from-teal-700 to-emerald-500 text-white font-bold text-xs flex items-center justify-center ring-2 ring-stone-200 shadow-xs">
              {teacher?.name
                ? teacher.name
                    .split(' ')
                    .filter(Boolean)
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')
                : 'CQ'}
            </div>
            {isExpanded && (
              <div className="overflow-hidden">
                <p className="text-sm font-semibold text-stone-800 leading-tight truncate">{teacher.name}</p>
                <p className="text-xs text-stone-500 truncate">{teacher.schoolName || 'Educator'}</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-stone-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] pb-safe">
        <div className="flex items-center justify-around p-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-medium min-w-[64px] cursor-pointer ${
                  isActive ? 'text-teal-800 font-bold bg-teal-50' : 'text-stone-500 hover:text-stone-700'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-teal-700' : 'text-stone-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};
