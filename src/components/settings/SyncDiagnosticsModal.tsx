import React, { useCallback, useEffect, useState } from 'react';
import { 
  Database, Cloud, RefreshCw, X, 
  CheckCircle2, AlertTriangle, ShieldCheck, Activity, Download, Upload 
} from 'lucide-react';
import { useTeacherStore } from '../../store/useTeacherStore';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { getSyncToken, syncHeaders } from '../../utils/syncAuth';

interface RemoteSummary {
  counts: Record<string, number>;
  lastUpdatedAt: string | null;
}

interface SyncDiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SyncDiagnosticsModal: React.FC<SyncDiagnosticsModalProps> = ({ isOpen, onClose }) => {
  const { 
    isSyncingWithEdge, isEdgeConnected, lastSyncedAt, 
    hasUnsyncedChanges, lastLocalMutationAt, syncDatabaseToEdge, 
    fetchDatabaseFromEdge, cohorts, students, tasks, 
    lessonPlans, attendanceRecords, sessions, claims, 
    language, addToast, syncAuthStatus 
  } = useTeacherStore();

  const [isPinging, setIsPinging] = useState(false);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [remote, setRemote] = useState<RemoteSummary | null>(null);

  useEscapeKey(onClose, isOpen);

  const loadSummary = useCallback(async () => {
    if (!getSyncToken()) return;
    const start = performance.now();
    try {
      const res = await fetch('/api/sync?summary=1', { cache: 'no-store', headers: syncHeaders() });
      if (!res.ok) {
        setRemote(null);
        setLatencyMs(null);
        return false;
      }
      const json = (await res.json()) as RemoteSummary;
      setRemote({ counts: json.counts || {}, lastUpdatedAt: json.lastUpdatedAt ?? null });
      setLatencyMs(Math.round(performance.now() - start));
      return true;
    } catch {
      setRemote(null);
      setLatencyMs(null);
      return false;
    }
  }, []);

  useEffect(() => {
    if (isOpen) void loadSummary();
  }, [isOpen, loadSummary]);

  if (!isOpen) return null;

  const handlePingTest = async () => {
    setIsPinging(true);
    const ok = await loadSummary();
    setIsPinging(false);
    if (ok) {
      addToast(language === 'id' ? 'Ping D1 sukses' : 'D1 ping success', 'success');
    } else {
      addToast(
        !getSyncToken()
          ? (language === 'id' ? 'Isi token sinkronisasi di Pengaturan' : 'Enter the sync token in Settings')
          : (language === 'id' ? 'Koneksi ke edge gagal' : 'Edge connection failed'),
        'error'
      );
    }
  };

  const handleManualPush = async () => {
    const ok = await syncDatabaseToEdge();
    if (ok) {
      addToast(language === 'id' ? 'Berhasil menyinkronkan data ke Cloudflare D1' : 'Successfully pushed data to Cloudflare D1', 'success');
      void loadSummary();
    } else {
      addToast(language === 'id' ? 'Gagal menyinkronkan ke D1' : 'Failed to push to D1', 'error');
    }
  };

  const handleManualPull = async () => {
    const ok = await fetchDatabaseFromEdge();
    if (ok) {
      addToast(language === 'id' ? 'Berhasil memperbarui data dari Cloudflare D1' : 'Successfully pulled truth from Cloudflare D1', 'success');
      void loadSummary();
    } else {
      addToast(language === 'id' ? 'Gagal mengambil data dari D1' : 'Failed to pull from D1', 'error');
    }
  };

  const entities = [
    { key: 'cohorts', label: language === 'id' ? 'Kelas Cohort' : 'Cohorts', count: cohorts.length, remote: remote?.counts.cohorts },
    { key: 'students', label: language === 'id' ? 'Siswa' : 'Students', count: students.length, remote: remote?.counts.students },
    { key: 'lessonPlans', label: language === 'id' ? 'Rencana Ajar' : 'Lesson Plans', count: lessonPlans.length, remote: remote?.counts.lessonPlans },
    { key: 'attendance', label: language === 'id' ? 'Catatan Kehadiran' : 'Attendance', count: attendanceRecords.length, remote: remote?.counts.attendance },
    { key: 'tasks', label: language === 'id' ? 'Tugas Prioritas' : 'Tasks', count: tasks.length, remote: remote?.counts.tasks },
    { key: 'sessions', label: language === 'id' ? 'Sesi Mengajar' : 'Teaching Sessions', count: sessions.length, remote: remote?.counts.sessions },
    { key: 'claims', label: language === 'id' ? 'Klaim Honor' : 'Teaching Claims', count: claims.length, remote: remote?.counts.claims },
  ];

  const authMessage =
    syncAuthStatus === 'missing'
      ? (language === 'id' ? 'Token sinkronisasi belum diisi (Pengaturan).' : 'Sync token not set (Settings).')
      : syncAuthStatus === 'rejected'
      ? (language === 'id' ? 'Server menolak token sinkronisasi.' : 'The server rejected the sync token.')
      : syncAuthStatus === 'unconfigured'
      ? (language === 'id' ? 'Server belum dikonfigurasi (SYNC_TOKEN).' : 'Server is not configured (SYNC_TOKEN).')
      : null;

  const formatTime = (isoString?: string | null) => {
    if (!isoString) return language === 'id' ? 'Belum pernah' : 'Never';
    try {
      const d = new Date(isoString);
      return new Intl.DateTimeFormat(language === 'id' ? 'id-ID' : 'en-US', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }).format(d);
    } catch {
      return isoString;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 scrim backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="theme-original flex items-center justify-between px-6 py-4 bg-stone-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-800 flex items-center justify-center text-teal-200 shadow-inner">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold tracking-tight text-white flex items-center gap-2">
                <span>{language === 'id' ? 'Diagnostik Cloudflare D1 & Sinkronisasi' : 'Cloudflare D1 Sync Diagnostics'}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-950 border border-teal-700 text-teal-300 font-mono">
                  classque_db
                </span>
              </h3>
              <p className="text-[11px] text-stone-400 font-medium">
                {language === 'id' ? 'Pusat Kebenaran Data (Edge) & Penyangga Lokal' : 'Central Source of Truth (Edge) & Local Buffer'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            aria-label="Tutup / Close"
            className="text-stone-400 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-stone-700">
          
          {/* Status Matrix Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            {/* Edge D1 Box */}
            <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-teal-950 flex items-center gap-1.5">
                  <Cloud className="w-4 h-4 text-teal-700" />
                  <span>Cloudflare D1 Edge</span>
                </span>
                {isEdgeConnected ? (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Online
                  </span>
                ) : (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    Offline
                  </span>
                )}
              </div>
              <p className="text-[11px] text-teal-800/90 leading-tight">
                {language === 'id' ? 'Pusat Kebenaran Data Utama (Serverless SQLite di 300+ lokasi Edge).' : 'Authoritative Central Source of Truth (Serverless Edge SQLite).'}
              </p>
              {authMessage && (
                <p className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1" data-testid="diag-auth-message">
                  {authMessage}
                </p>
              )}
              <div className="pt-2 border-t border-teal-200/60 flex items-center justify-between text-[10px] text-teal-900 font-medium">
                <span>{language === 'id' ? 'Sinkronisasi Terakhir:' : 'Last Synced:'}</span>
                <span className="font-bold">{formatTime(lastSyncedAt)}</span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-teal-900 font-medium">
                <span>{language === 'id' ? 'Update Terakhir di D1:' : 'Last Updated in D1:'}</span>
                <span className="font-bold" data-testid="diag-remote-updated">{remote?.lastUpdatedAt ? formatTime(remote.lastUpdatedAt.replace(' ', 'T') + 'Z') : '—'}</span>
              </div>
            </div>

            {/* Local Buffer Box */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-stone-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>Local-First Buffer</span>
                </span>
                {hasUnsyncedChanges ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Unsynced</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-teal-700" />
                    <span>In-Sync</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-stone-500 leading-tight">
                {language === 'id' ? 'Resisten pemadaman internet sekolah. Perubahan tersimpan instan di peramban.' : 'Brownout-resistant. Edits persist locally in browser and auto-sync.'}
              </p>
              <div className="pt-2 border-t border-stone-200 flex items-center justify-between text-[10px] text-stone-600 font-medium">
                <span>{language === 'id' ? 'Edit Lokal Terakhir:' : 'Last Local Edit:'}</span>
                <span className="font-bold">{formatTime(lastLocalMutationAt)}</span>
              </div>
            </div>

          </div>

          {/* Record Inventory Breakdown */}
          <div className="bg-stone-50/80 rounded-2xl p-4 border border-stone-200/80">
            <h4 className="text-xs font-bold text-stone-900 mb-3 flex items-center justify-between">
              <span>{language === 'id' ? 'Daftar Entitas Terkelola' : 'Managed Entity Inventory'}</span>
              <span className="text-[10px] text-stone-500 font-normal">
                {entities.reduce((acc, e) => acc + e.count, 0)} {language === 'id' ? 'rekaman lokal' : 'local records'}
                {remote ? ` • ${entities.reduce((acc, e) => acc + (e.remote ?? 0), 0)} ${language === 'id' ? 'di D1' : 'in D1'}` : ''}
              </span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              {entities.map((item, i) => (
                <div key={i} className="bg-white p-2.5 rounded-xl border border-stone-200/70 shadow-2xs">
                  <span className="text-lg font-black text-stone-900 block tracking-tight">
                    {item.count}
                  </span>
                  <span className="text-[10px] font-semibold text-stone-500 block truncate">
                    {item.label}
                  </span>
                  <span className="text-[10px] font-mono text-teal-700 block" data-testid={`diag-remote-${item.key}`}>
                    {item.remote === undefined ? '—' : `D1: ${item.remote}`}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Ping & Network Diagnostics */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-stone-200 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <Activity className="w-4 h-4 text-teal-700" />
              <div>
                <span className="font-bold text-stone-900 block text-xs">
                  {language === 'id' ? 'Uji Latensi Edge Cloudflare' : 'Cloudflare Edge Ping Test'}
                </span>
                <span className="text-[11px] text-stone-500">
                  {latencyMs !== null ? `${latencyMs} ms latency` : (language === 'id' ? 'Belum diuji' : 'Not tested')}
                </span>
              </div>
            </div>
            <button
              onClick={handlePingTest}
              disabled={isPinging}
              className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin' : ''}`} />
              <span>{isPinging ? 'Pinging...' : 'Test Ping'}</span>
            </button>
          </div>

        </div>

        {/* Modal Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 bg-stone-50 border-t border-stone-200">
          <button
            onClick={handleManualPull}
            disabled={isSyncingWithEdge}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white border border-stone-200 hover:bg-stone-100 text-stone-800 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs disabled:opacity-50"
            title="Tarik versi data terbaru dari Cloudflare D1"
          >
            <Download className="w-4 h-4 text-teal-700" />
            <span>{language === 'id' ? 'Tarik Data dari D1' : 'Pull from D1'}</span>
          </button>

          <button
            onClick={handleManualPush}
            disabled={isSyncingWithEdge}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-extrabold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
          >
            <Upload className={`w-4 h-4 ${isSyncingWithEdge ? 'animate-spin' : ''}`} />
            <span>{isSyncingWithEdge ? 'Menyinkronkan...' : (language === 'id' ? 'Sinkronkan Sekarang ke D1' : 'Push Local to D1')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
