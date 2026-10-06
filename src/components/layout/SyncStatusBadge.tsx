import React, { useState, useEffect } from 'react';
import { CloudCheck, CloudOff, RefreshCw, AlertTriangle } from 'lucide-react';
import { Language } from '../../types';
import { useTeacherStore } from '../../store/useTeacherStore';
import { SyncDiagnosticsModal } from '../settings/SyncDiagnosticsModal';

interface SyncStatusBadgeProps {
  language: Language;
  compact?: boolean;
}

export const SyncStatusBadge: React.FC<SyncStatusBadgeProps> = ({ language, compact = false }) => {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);
  const { isSyncingWithEdge, isEdgeConnected, hasUnsyncedChanges, syncAuthStatus } = useTeacherStore();
  const authProblem = syncAuthStatus === 'missing' || syncAuthStatus === 'rejected' || syncAuthStatus === 'unconfigured';

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
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 whitespace-nowrap rounded-full text-xs font-semibold border transition-all cursor-pointer select-none hover:shadow-xs hover:scale-[1.02] active:scale-95 ${
          isSyncingWithEdge
            ? 'bg-blue-50 text-blue-800 border-blue-200'
            : !isOnline
            ? 'bg-amber-50 text-amber-900 border-amber-300'
            : authProblem
            ? 'bg-amber-50 text-amber-900 border-amber-300'
            : hasUnsyncedChanges
            ? 'bg-amber-50/90 text-amber-800 border-amber-300'
            : isEdgeConnected
            ? 'bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100/70'
            : 'bg-stone-100 text-stone-700 border-stone-300'
        }`}
        title={
          language === 'id'
            ? isSyncingWithEdge
              ? 'Sinkronisasi ke Cloudflare D1 sedang berlangsung...'
              : authProblem
              ? (syncAuthStatus === 'missing' ? 'Token sinkronisasi belum diisi (Pengaturan)' : syncAuthStatus === 'rejected' ? 'Token sinkronisasi ditolak server' : 'Server belum dikonfigurasi (SYNC_TOKEN)')
              : hasUnsyncedChanges
              ? 'Perubahan lokal tersimpan di browser, menunggu sinkronisasi D1'
              : 'Klik untuk membuka Diagnostik Cloudflare D1'
            : isSyncingWithEdge
            ? 'Syncing to Cloudflare D1...'
            : authProblem
            ? (syncAuthStatus === 'missing' ? 'Sync token not set (Settings)' : syncAuthStatus === 'rejected' ? 'The server rejected the sync token' : 'Server is not configured (SYNC_TOKEN)')
            : hasUnsyncedChanges
            ? 'Local changes are saved in this browser, waiting to sync to D1'
            : 'Click to open Cloudflare D1 diagnostics'
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
            <CloudOff className="w-3.5 h-3.5 text-amber-700" />
            {!compact && <span>{language === 'id' ? 'Luar Jaringan' : 'Offline'}</span>}
          </>
        ) : authProblem ? (
          <>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
            {!compact && <span>{syncAuthStatus === 'missing' ? (language === 'id' ? 'Perlu Token' : 'Token Needed') : syncAuthStatus === 'rejected' ? (language === 'id' ? 'Token Ditolak' : 'Token Rejected') : (language === 'id' ? 'Server Belum Diatur' : 'Server Not Set')}</span>}
          </>
        ) : hasUnsyncedChanges ? (
          <>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
            {!compact && <span>{language === 'id' ? 'Belum Tersinkron' : 'Unsynced'}</span>}
          </>
        ) : isEdgeConnected ? (
          <>
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></span>
            <CloudCheck className="w-3.5 h-3.5 text-teal-600" />
            {!compact && <span className="hidden sm:inline">{language === 'id' ? 'D1 Tersinkron' : 'D1 Synced'}</span>}
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
