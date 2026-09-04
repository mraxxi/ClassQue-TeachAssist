import React, { useState, useEffect } from 'react';
import { CloudCheck, CloudOff } from 'lucide-react';
import { Language } from '../../types';

interface SyncStatusBadgeProps {
  language: Language;
}

export const SyncStatusBadge: React.FC<SyncStatusBadgeProps> = ({ language }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
        isOnline
          ? 'bg-teal-50 text-teal-800 border-teal-200'
          : 'bg-amber-50 text-amber-800 border-amber-200'
      }`}
      title={isOnline ? 'Cloudflare D1 Edge Synced' : 'Offline Mode (Local IndexedDB buffering)'}
    >
      {isOnline ? (
        <>
          <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></span>
          <CloudCheck className="w-3.5 h-3.5 text-teal-600" />
          <span className="hidden sm:inline">D1 Synced</span>
        </>
      ) : (
        <>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          <CloudOff className="w-3.5 h-3.5 text-amber-600" />
          <span>{language === 'id' ? 'Lokal (Offline)' : 'Offline Mode'}</span>
        </>
      )}
    </div>
  );
};
