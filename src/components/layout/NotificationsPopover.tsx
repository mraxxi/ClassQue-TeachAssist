import React, { useRef, useEffect } from 'react';
import { formatRelative } from '../../utils/date';
import { 
  Bell, Clock, CheckSquare, Receipt, Users, 
  CheckCheck, Trash2, X, ChevronRight, AlertCircle 
} from 'lucide-react';
import { useTeacherStore } from '../../store/useTeacherStore';
import { NotificationItem } from '../../types';

interface NotificationsPopoverProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsPopover: React.FC<NotificationsPopoverProps> = ({ isOpen, onClose }) => {
  const { 
    notifications, markNotificationAsRead, 
    markAllNotificationsAsRead, clearNotifications, 
    setActiveTab, language 
  } = useTeacherStore();
  
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on Escape or Outside Click
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getCategoryIcon = (cat: NotificationItem['category']) => {
    switch (cat) {
      case 'schedule':
        return <Clock className="w-4 h-4 text-sky-700" />;
      case 'task':
        return <CheckSquare className="w-4 h-4 text-amber-700" />;
      case 'claim':
        return <Receipt className="w-4 h-4 text-emerald-700" />;
      case 'attendance':
        return <Users className="w-4 h-4 text-teal-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-stone-500" />;
    }
  };

  const handleNotificationClick = (item: NotificationItem) => {
    markNotificationAsRead(item.id);
    if (item.actionTab) {
      setActiveTab(item.actionTab);
    }
    onClose();
  };

  return (
    <div 
      ref={popoverRef}
      className="absolute bottom-16 left-4 md:left-20 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-stone-200/90 z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-150"
    >
      {/* Popover Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-stone-50/80 border-b border-stone-200/80">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-teal-800" />
          <h4 className="text-xs font-black text-stone-900 tracking-tight">
            {language === 'id' ? 'Pusat Notifikasi' : 'Notifications'}
          </h4>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-200">
              {unreadCount} {language === 'id' ? 'baru' : 'new'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              onClick={() => markAllNotificationsAsRead()}
              className="text-[11px] font-semibold text-teal-700 hover:text-teal-900 px-2 py-1 rounded-md hover:bg-teal-50 transition-colors flex items-center gap-1 cursor-pointer"
              title="Tandai semua dibaca"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{language === 'id' ? 'Tandai Dibaca' : 'Mark Read'}</span>
            </button>
          )}
          <button
            onClick={onClose}
            aria-label="Tutup / Close"
            className="text-stone-400 hover:text-stone-600 p-1 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Popover List */}
      <div className="max-h-[340px] overflow-y-auto divide-y divide-stone-100 pr-0.5">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-stone-400 text-xs">
            <Bell className="w-8 h-8 mx-auto text-stone-300 mb-2 opacity-50" />
            <p>{language === 'id' ? 'Tidak ada notifikasi saat ini.' : 'No notifications.'}</p>
          </div>
        ) : (
          notifications.map((item) => (
            <div
              key={item.id}
              onClick={() => handleNotificationClick(item)}
              className={`p-3 sm:p-3.5 transition-all flex items-start gap-3 cursor-pointer select-none hover:bg-stone-50/80 ${
                !item.isRead ? 'bg-teal-50/20' : 'opacity-75'
              }`}
            >
              <div className="w-8 h-8 rounded-xl bg-stone-100 border border-stone-200/60 flex items-center justify-center shrink-0 mt-0.5">
                {getCategoryIcon(item.category)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <p className={`text-xs leading-snug truncate ${!item.isRead ? 'font-bold text-stone-900' : 'font-medium text-stone-700'}`}>
                    {item.title}
                  </p>
                  <span className="text-[10px] text-stone-400 font-medium shrink-0">
                    {formatRelative(item.timestamp, language)}
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 leading-relaxed mt-0.5 line-clamp-2">
                  {item.message}
                </p>
              </div>

              {!item.isRead ? (
                <div className="w-2 h-2 rounded-full bg-teal-600 ring-2 ring-teal-200 shrink-0 mt-1.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-stone-300 shrink-0 mt-1" />
              )}
            </div>
          ))
        )}
      </div>

      {/* Popover Footer */}
      {notifications.length > 0 && (
        <div className="p-2.5 bg-stone-50 border-t border-stone-200/80 flex items-center justify-between text-[11px]">
          <span className="text-stone-400">
            {notifications.length} {language === 'id' ? 'total pengingat' : 'total alerts'}
          </span>
          <button
            onClick={() => clearNotifications()}
            className="text-stone-500 hover:text-rose-700 transition-colors flex items-center gap-1 font-medium cursor-pointer"
          >
            <Trash2 className="w-3 h-3" />
            <span>{language === 'id' ? 'Bersihkan Semua' : 'Clear All'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
