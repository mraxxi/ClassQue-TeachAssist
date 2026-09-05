import React, { useState, useEffect } from 'react';
import { CloudCheck, CloudOff, RefreshCw, AlertTriangle } from 'lucide-react';
import { Language } from '../../types';
import { useTeacherStore } from '../../store/facade';
import { SyncDiagnosticsModal } from '../settings/SyncDiagnosticsModal';

interface SyncStatusBadgeProps {
  language: Language;
  compact?: boolean;
}

export const SyncStatusBadge: React.FC<SyncStatusBadgeProps> = ({ language, compact = false }) => {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);
  const { isSyncingWithEdge, isEdgeConnected, hasUnsyncedChanges } = useTeacherStore();

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
    <>
      <button
        type="button"
        onClick={() => setIsDiagnosticsOpen(true)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer select-none hover:shadow-xs hover:scale-[1.02] active:scale-95 ${
          isSyncingWithEdge
            ? 'bg-blue-50 text-blue-800 border-blue-200'
            : !isOnline
            ? 'bg-amber-50 text-amber-900 border-amber-300'
            : hasUnsyncedChanges
            ? 'bg-amber-50/90 text-amber-800 border-amber-300'
            : isEdgeConnected
            ? 'bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100/70'
            : 'bg-stone-100 text-stone-700 border-stone-300'
        }`}
        title={
          isSyncingWithEdge
            ? 'Sinkronisasi ke Cloudflare D1 sedang berlangsung...'
            : hasUnsyncedChanges
            ? 'Perubahan lokal tersimpan di browser, menunggu sinkronisasi D1'
            : 'Klik untuk membuka Diagnostik Cloudflare D1'
        }
      >
        {isSyncingWithEdge ? (
          <>
            <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
            {!compact && <span className="hidden sm:inline">{language === 'id' ? 'Menyinkronkan...' : 'Syncing...'}</span>}
          </>
        ) : !isOnline ? (
          <>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            <CloudOff className="w-3.5 h-3.5 text-amber-600" />
            {!compact && <span>{language === 'id' ? 'Luar Jaringan' : 'Offline'}</span>}
          </>
        ) : hasUnsyncedChanges ? (
          <>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            {!compact && <span>{language === 'id' ? 'Belum Tersinkron' : 'Unsynced'}</span>}
          </>
        ) : isEdgeConnected ? (
          <>
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></span>
            <CloudCheck className="w-3.5 h-3.5 text-teal-600" />
            {!compact && <span className="hidden sm:inline">D1 Synced</span>}
          </>
        ) : (
          <>
            <span className="w-1.5 h-1.5 rounded-full bg-stone-400"></span>
            <CloudOff className="w-3.5 h-3.5 text-stone-500" />
            {!compact && <span>{language === 'id' ? 'Penyangga Lokal' : 'Local Buffer'}</span>}
          </>
        )}
      </button>

      {/* Deep Sync & Central Source of Truth Diagnostics Modal */}
      <SyncDiagnosticsModal 
        isOpen={isDiagnosticsOpen} 
        onClose={() => setIsDiagnosticsOpen(false)} 
      />
    </>
  );
};
