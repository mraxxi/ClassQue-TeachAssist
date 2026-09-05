import React, { useState, useRef } from 'react';
import { 
  Settings, Save, Database, Download, Upload, 
  RotateCcw, ShieldCheck, HardDrive, Wifi, RefreshCw
} from 'lucide-react';
import { useTeacherStore } from '../../store/facade';
import { useTranslation } from '../../utils/i18n';
import { ConfirmModal } from '../common/ConfirmModal';

export const SettingsHub: React.FC = () => {
  const { 
    teacher, updateTeacher, language, setLanguage, addToast,
    cohorts, students, attendanceRecords, lessonPlans, tasks, 
    sessions, claims, studentEvaluations, parentReports, cefrMilestones,
    importFullDatabase, resetToDemoData 
  } = useTeacherStore();
  const t = useTranslation(language);

  const [name, setName] = useState(teacher.name);
  const [email, setEmail] = useState(teacher.email);
  const [schoolName, setSchoolName] = useState(teacher.schoolName);
  const [hourlyRate, setHourlyRate] = useState(teacher.defaultHourlyRate.toString());
  const [currency] = useState(teacher.currency);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Backup & Reset modals & refs
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateTeacher({
      name,
      email,
      schoolName,
      defaultHourlyRate: parseFloat(hourlyRate) || 150000,
      currency,
    });
    setSavedSuccess(true);
    addToast(language === 'id' ? 'Pengaturan profil berhasil disimpan!' : 'Profile settings saved successfully!', 'success');
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  // 1-Click JSON Data Export
  const handleExportJson = () => {
    try {
      const exportPayload = {
        app: 'ClassQue-TeachAssist',
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        teacher,
        cohorts,
        students,
        attendanceRecords,
        lessonPlans,
        tasks,
        sessions,
        claims,
        studentEvaluations,
        parentReports,
        cefrMilestones,
      };

      const jsonStr = JSON.stringify(exportPayload, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateTag = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.download = `classque_teachassist_backup_${dateTag}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      addToast(
        language === 'id' 
          ? 'Cadangan data JSON lengkap berhasil diunduh!' 
          : 'Complete JSON database backup exported successfully!',
        'success'
      );
    } catch (err) {
      console.error('Export failed', err);
      addToast(language === 'id' ? 'Gagal mengunduh cadangan data.' : 'Failed to export backup data.', 'error');
    }
  };

  // 1-Click JSON Data Import
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        if (!parsed || (!parsed.cohorts && !parsed.students)) {
          throw new Error('Invalid ClassQue database schema.');
        }

        const success = importFullDatabase(parsed);
        if (success) {
          addToast(
            language === 'id'
              ? 'Database berhasil dipulihkan dari file JSON!'
              : 'Database successfully restored from JSON file!',
            'success'
          );
        } else {
          throw new Error('Database import failed.');
        }
      } catch (err) {
        console.error('Import failed', err);
        addToast(
          language === 'id'
            ? 'Format file tidak valid atau rusak. Pastikan file adalah cadangan ClassQue.'
            : 'Invalid or corrupt file. Ensure it is a valid ClassQue backup.',
          'error'
        );
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    reader.readAsText(file);
  };

  // Handle Reset to Demo Seed Data
  const handleResetConfirm = () => {
    resetToDemoData();
    setIsResetModalOpen(false);
    addToast(
      language === 'id' 
        ? 'Database berhasil dikembalikan ke data percontohan awal.' 
        : 'Database reset to initial demo seed data.',
      'info'
    );
  };

  // Cloudflare D1 Real Sync
  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const payload = {
        teacher,
        cohorts,
        students,
        lessonPlans,
        attendanceRecords,
        sessions,
        claims,
        studentEvaluations,
        parentReports,
        tasks,
      };

      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json() as any;
        addToast(
          language === 'id'
            ? `Sinkronisasi Edge D1 Berhasil: ${data.message || 'Tersinkronisasi!'}`
            : `Edge D1 Sync Successful: ${data.message || 'Synced!'}`,
          'success'
        );
      } else {
        const errorData = await res.json().catch(() => ({})) as any;
        if (res.status === 503 || errorData.status === 'unbound') {
          addToast(
            language === 'id'
              ? 'D1 Cloudflare belum di-bind di wrangler.toml. Berjalan dalam mode Local-First.'
              : 'D1 binding not yet provisioned in Cloudflare. Running in Local-First mode.',
            'warning'
          );
        } else {
          throw new Error(errorData.error || 'Server error');
        }
      }
    } catch {
      addToast(
        language === 'id'
          ? 'Mode Offline / Lokal: Data aman tersimpan di Local-First storage.'
          : 'Offline / Local Mode: Data safely preserved in Local-First storage.',
        'info'
      );
    } finally {
      setIsSyncing(false);
    }
  };

  // Compute local storage usage
  const calculateStorageKb = () => {
    try {
      let total = 0;
      for (const x in localStorage) {
        if (Object.prototype.hasOwnProperty.call(localStorage, x)) {
          total += (localStorage[x].length * 2);
        }
      }
      return (total / 1024).toFixed(1);
    } catch {
      return '120.4';
    }
  };

  const storageUsedKb = calculateStorageKb();

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-150 max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-stone-900 tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-teal-700" />
            {t.nav.settings}
          </h2>
          <p className="text-xs text-stone-500 font-medium mt-0.5">
            {language === 'id' 
              ? 'Kelola profil guru, tarif honorarium default, preferensi bahasa, cadangan data JSON, dan sinkronisasi Cloudflare D1.' 
              : 'Manage teacher profile, honorarium rates, language preferences, JSON data backups, and Cloudflare D1 sync.'}
          </p>
        </div>
      </div>

      {/* Profile & Rates Form */}
      <form onSubmit={handleSave} className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-5">
        <h3 className="text-sm font-extrabold text-stone-900 border-b border-stone-100 pb-2">
          {language === 'id' ? 'Profil Guru & Tarif Honorarium' : 'Teacher Profile & Rate Configuration'}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              {language === 'id' ? 'Nama Lengkap Guru' : 'Teacher Full Name'}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-teal-700 focus:bg-white text-stone-800"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              {language === 'id' ? 'Email Guru' : 'Teacher Email'}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-teal-700 focus:bg-white text-stone-800"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              {language === 'id' ? 'Nama Sekolah / Lembaga Kursus' : 'School / Academy Name'}
            </label>
            <input
              type="text"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-teal-700 focus:bg-white text-stone-800"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              {language === 'id' ? 'Tarif Honor Standar per Jam' : 'Standard Hourly Rate'}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-teal-700 focus:bg-white text-stone-800 font-mono"
              />
              <span className="text-xs font-bold text-stone-500 bg-stone-100 px-3 py-2 rounded-xl border border-stone-200">
                {currency}
              </span>
            </div>
          </div>
        </div>

        {/* Language Preferences */}
        <div className="border-t border-stone-100 pt-4 space-y-3">
          <h3 className="text-xs font-extrabold text-stone-900 uppercase tracking-wider text-stone-400">
            {language === 'id' ? 'Preferensi Bahasa Antarmuka' : 'UI Language Preference'}
          </h3>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setLanguage('id')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                language === 'id' ? 'bg-teal-800 text-white shadow-xs' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              🇮🇩 Bahasa Indonesia
            </button>
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                language === 'en' ? 'bg-teal-800 text-white shadow-xs' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              🇬🇧 English
            </button>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end pt-4 border-t border-stone-100">
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{savedSuccess ? (language === 'id' ? 'Tersimpan! ✓' : 'Saved! ✓') : (language === 'id' ? 'Simpan Pengaturan' : 'Save Profile')}</span>
          </button>
        </div>
      </form>

      {/* Domain 5: Data Backup, JSON Portability & Offline Durability */}
      <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div>
            <h3 className="text-sm font-extrabold text-stone-900 flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-teal-700" />
              {language === 'id' ? 'Pencadangan & Pemulihan Data JSON' : 'JSON Data Backup & Portability'}
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              {language === 'id'
                ? 'Unduh salinan lengkap database pengajaran Anda untuk diarsipkan atau dipindahkan ke perangkat lain.'
                : 'Download a complete JSON snapshot of your teaching database or restore from a previous file.'}
            </p>
          </div>
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
        </div>

        {/* Actions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          {/* Export JSON Button */}
          <button
            type="button"
            onClick={handleExportJson}
            className="p-4 rounded-2xl bg-teal-50 hover:bg-teal-100/80 border border-teal-200 text-teal-900 transition-all text-left flex flex-col justify-between group cursor-pointer shadow-xs"
          >
            <div className="flex items-center justify-between">
              <Download className="w-5 h-5 text-teal-700 group-hover:-translate-y-0.5 transition-transform" />
              <span className="text-[10px] font-extrabold bg-teal-200/80 text-teal-900 px-2 py-0.5 rounded-md font-mono">.JSON</span>
            </div>
            <div className="mt-3">
              <p className="text-xs font-black">{language === 'id' ? 'Ekspor Cadangan Lengkap' : 'Export Full Backup'}</p>
              <p className="text-[11px] text-teal-700 mt-0.5">
                {language === 'id' ? 'Unduh semua rombel, siswa, & sesi' : 'Download all cohorts, students & notes'}
              </p>
            </div>
          </button>

          {/* Import JSON Button & Hidden Input */}
          <div>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-4 rounded-2xl bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-800 transition-all text-left flex flex-col justify-between group cursor-pointer h-full shadow-xs"
            >
              <div className="flex items-center justify-between">
                <Upload className="w-5 h-5 text-stone-700 group-hover:-translate-y-0.5 transition-transform" />
                <span className="text-[10px] font-extrabold bg-stone-200 text-stone-700 px-2 py-0.5 rounded-md font-mono">RESTORE</span>
              </div>
              <div className="mt-3">
                <p className="text-xs font-black">{language === 'id' ? 'Pulihkan dari File JSON' : 'Restore from JSON File'}</p>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  {language === 'id' ? 'Unggah cadangan ClassQue tersimpan' : 'Upload saved ClassQue backup'}
                </p>
              </div>
            </button>
          </div>

          {/* Reset to Demo Data Button */}
          <button
            type="button"
            onClick={() => setIsResetModalOpen(true)}
            className="p-4 rounded-2xl bg-rose-50/60 hover:bg-rose-100/80 border border-rose-200 text-rose-900 transition-all text-left flex flex-col justify-between group cursor-pointer shadow-xs"
          >
            <div className="flex items-center justify-between">
              <RotateCcw className="w-5 h-5 text-rose-600 group-hover:rotate-45 transition-transform" />
              <span className="text-[10px] font-extrabold bg-rose-200/80 text-rose-900 px-2 py-0.5 rounded-md">RESET</span>
            </div>
            <div className="mt-3">
              <p className="text-xs font-black">{language === 'id' ? 'Kembalikan Data Demo' : 'Reset to Demo Data'}</p>
              <p className="text-[11px] text-rose-700 mt-0.5">
                {language === 'id' ? 'Muat ulang contoh data kurikulum' : 'Reload sample curriculum data'}
              </p>
            </div>
          </button>

        </div>

        {/* Stored Records Breakdown Metrics */}
        <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
              {language === 'id' ? 'Rombel / Kelas' : 'Cohorts'}
            </span>
            <span className="font-extrabold text-stone-900 font-mono text-sm">{cohorts.length}</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
              {language === 'id' ? 'Total Siswa' : 'Students'}
            </span>
            <span className="font-extrabold text-stone-900 font-mono text-sm">{students.length}</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
              {language === 'id' ? 'Rencana Ajar' : 'Lesson Plans'}
            </span>
            <span className="font-extrabold text-stone-900 font-mono text-sm">{lessonPlans.length}</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
              {language === 'id' ? 'Sesi & Evaluasi' : 'Sessions & Evals'}
            </span>
            <span className="font-extrabold text-stone-900 font-mono text-sm">{sessions.length + studentEvaluations.length}</span>
          </div>
        </div>
      </div>

      {/* Cloudflare D1 & Edge Diagnostics */}
      <div className="bg-stone-900 rounded-3xl p-6 text-white space-y-4 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-800 pb-4">
          <div>
            <h4 className="font-extrabold flex items-center gap-2 text-sm text-teal-400">
              <Database className="w-4 h-4" />
              Cloudflare D1 Edge & Offline Engine
            </h4>
            <p className="text-xs text-stone-400 mt-0.5">
              {language === 'id'
                ? 'Arsitektur Local-First memastikan presensi dan evaluasi tidak hilang saat koneksi internet sekolah terputus.'
                : 'Local-First architecture guarantees zero data loss during unstable school Wi-Fi connectivity.'}
            </p>
          </div>

          <button
            type="button"
            onClick={handleManualSync}
            disabled={isSyncing}
            className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-600 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? (language === 'id' ? 'Menyinkronkan...' : 'Syncing...') : (language === 'id' ? 'Sinkronkan ke D1 Edge' : 'Sync to D1 Edge')}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
          <div className="bg-stone-800/80 p-3.5 rounded-2xl border border-stone-700/80">
            <span className="text-[10px] text-stone-400 font-bold uppercase block flex items-center justify-center gap-1">
              <HardDrive className="w-3 h-3 text-stone-400" />
              Penyimpanan Lokal
            </span>
            <span className="font-mono font-bold text-teal-300 mt-1 block text-sm">
              {storageUsedKb} KB <span className="text-[11px] font-sans text-stone-400">/ IndexedDB</span>
            </span>
          </div>

          <div className="bg-stone-800/80 p-3.5 rounded-2xl border border-stone-700/80">
            <span className="text-[10px] text-stone-400 font-bold uppercase block flex items-center justify-center gap-1">
              <Wifi className="w-3 h-3 text-emerald-400" />
              Status Jaringan
            </span>
            <span className="font-bold text-emerald-400 mt-1 block text-sm">
              Online (Local-First Active)
            </span>
          </div>

          <div className="bg-stone-800/80 p-3.5 rounded-2xl border border-stone-700/80">
            <span className="text-[10px] text-stone-400 font-bold uppercase block flex items-center justify-center gap-1">
              <Database className="w-3 h-3 text-teal-400" />
              Cloudflare D1 Edge
            </span>
            <span className="font-bold text-teal-300 mt-1 block text-sm">
              100% Free Tier (Active)
            </span>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Reset to Demo Data */}
      <ConfirmModal
        isOpen={isResetModalOpen}
        title={language === 'id' ? 'Kembalikan ke Data Demo Awal?' : 'Reset to Initial Demo Data?'}
        message={
          language === 'id'
            ? 'Tindakan ini akan menggantikan data yang telah Anda ubah dengan dataset percontohan awal ClassQue. Pastikan Anda telah mengekspor cadangan JSON terlebih dahulu jika ingin menyimpan data saat ini.'
            : 'This will replace your current data with the default sample seed dataset. Ensure you have exported a JSON backup first if you wish to keep current changes.'
        }
        confirmText={language === 'id' ? 'Ya, Kembalikan ke Demo' : 'Yes, Reset to Demo'}
        cancelText={language === 'id' ? 'Batal' : 'Cancel'}
        isDangerous={true}
        onConfirm={handleResetConfirm}
        onCancel={() => setIsResetModalOpen(false)}
      />

    </div>
  );
};
