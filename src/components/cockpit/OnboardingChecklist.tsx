import React, { useState } from 'react';
import { CheckCircle2, Circle, Rocket, X } from 'lucide-react';
import { useTeacherStore } from '../../store/useTeacherStore';
import { getSyncToken } from '../../utils/syncAuth';

const DISMISS_KEY = 'classque_onboarding_dismissed';
const readDismissed = () => {
  try { return localStorage.getItem(DISMISS_KEY) === '1'; } catch { return false; }
};

/**
 * First-run guide on the Cockpit. It only appears while the basics are missing (no cohort or no student), so a
 * working setup is never cluttered, and it can be dismissed for good.
 */
export const OnboardingChecklist: React.FC = () => {
  const { language, cohorts, students, lessonPlans, attendanceRecords, setActiveTab } = useTeacherStore();
  const [dismissed, setDismissed] = useState(readDismissed);
  const id = language === 'id';

  const hasCore = cohorts.length > 0 && students.length > 0;
  if (dismissed || hasCore) return null;

  const steps = [
    { done: cohorts.length > 0, label: id ? 'Buat rombel pertama' : 'Create your first cohort', hint: id ? 'Nama, level CEFR, hari & jam mengajar.' : 'Name, CEFR level, teaching days and time.', go: () => setActiveTab('classes-students') },
    { done: students.length > 0, label: id ? 'Tambahkan siswa' : 'Add your students', hint: id ? 'Lengkap dengan kontak wali untuk WhatsApp.' : 'With guardian contact for WhatsApp.', go: () => setActiveTab('classes-students') },
    { done: lessonPlans.length > 0, label: id ? 'Susun rencana pembelajaran' : 'Draft a lesson plan', hint: id ? '5 tahap + bank kosakata.' : '5 stages plus a vocabulary bank.', go: () => setActiveTab('lesson-planner') },
    { done: attendanceRecords.length > 0, label: id ? 'Catat presensi pertama' : 'Take your first roll-call', hint: id ? 'Dari Kokpit atau tab Presensi.' : 'From the Cockpit or the Attendance tab.', go: () => setActiveTab('classes-students') },
    { done: !!getSyncToken(), label: id ? 'Hubungkan sinkronisasi (opsional)' : 'Connect sync (optional)', hint: id ? 'Masukkan token agar data tercadang di Cloudflare D1.' : 'Paste the token to back your data up to Cloudflare D1.', go: () => setActiveTab('settings') },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  const nextIdx = steps.findIndex((s) => !s.done);

  return (
    <section aria-label={id ? 'Mulai menggunakan ClassQue' : 'Get started with ClassQue'} className="bg-white rounded-3xl border border-teal-200 p-5 sm:p-6 space-y-4 shadow-xs" data-testid="onboarding">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-800 text-white flex items-center justify-center shrink-0"><Rocket className="w-5 h-5" aria-hidden="true" /></div>
          <div>
            <h3 className="text-base font-extrabold text-stone-900">{id ? 'Selamat datang di ClassQue!' : 'Welcome to ClassQue!'}</h3>
            <p className="text-sm text-stone-600">{id ? `Siapkan dalam beberapa menit — ${doneCount} dari ${steps.length} langkah selesai.` : `Set up in a few minutes — ${doneCount} of ${steps.length} steps done.`}</p>
          </div>
        </div>
        <button
          onClick={() => { try { localStorage.setItem(DISMISS_KEY, '1'); } catch { /* ignore */ } setDismissed(true); }}
          aria-label={id ? 'Sembunyikan panduan' : 'Dismiss guide'}
          className="p-2 -m-2 rounded-lg text-stone-500 hover:bg-stone-100 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="h-1.5 rounded-full bg-stone-200 overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={steps.length} aria-valuenow={doneCount}>
        <div className="h-full bg-teal-600 rounded-full transition-all" style={{ width: `${(doneCount / steps.length) * 100}%` }} />
      </div>
      <ol className="grid sm:grid-cols-2 gap-2.5">
        {steps.map((st, i) => (
          <li key={i}>
            <button
              onClick={st.go}
              className={`w-full text-left flex items-start gap-3 p-3 rounded-2xl border transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-teal-700 ${
                i === nextIdx ? 'border-teal-400 bg-teal-50' : 'border-stone-200 hover:bg-stone-50'
              }`}
            >
              {st.done ? <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" aria-label={id ? 'Selesai' : 'Done'} /> : <Circle className="w-5 h-5 text-stone-400 shrink-0 mt-0.5" aria-hidden="true" />}
              <span>
                <span className={`block text-sm font-bold ${st.done ? 'text-stone-500 line-through' : 'text-stone-900'}`}>{st.label}</span>
                <span className="block text-xs text-stone-600">{st.hint}</span>
              </span>
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
};
