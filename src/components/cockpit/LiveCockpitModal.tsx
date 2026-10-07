import React, { useState, useEffect } from 'react';
import { 
  X, Play, Pause, CheckCircle2, 
  BookOpen, Users, StickyNote, Award, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useTeacherStore } from '../../store/useTeacherStore';
import { useTranslation } from '../../utils/i18n';
import { AttendanceStatus, CompetencyScore } from '../../types';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { AttendanceControl, RollCallProgress } from '../common/AttendanceControl';
import { localDateStr } from '../../utils/date';

export const LiveCockpitModal: React.FC = () => {
  const { 
    isLiveCockpitOpen, setLiveCockpitOpen, activeSessionCohortId,
    cohorts, students, lessonPlans, attendanceRecords, setAttendance,
    cefrMilestones, studentEvaluations, setStudentMilestoneScore,
    stopwatchSeconds, isStopwatchRunning, pauseLiveSession, resumeLiveSession,
    tickStopwatch, finishLiveSession, liveScratchpad, setLiveScratchpad, language, addToast 
  } = useTeacherStore();
  const t = useTranslation(language);

  const [activeStageIndex, setActiveStageIndex] = useState(0);
  const [selectedStudentForGrading, setSelectedStudentForGrading] = useState<string | null>(null);
  // Phones show ONE section at a time (tabs); from `lg` up everything is visible side by side.
  const [mobileTab, setMobileTab] = useState<'roll' | 'grade' | 'lesson' | 'notes'>('roll');
  const tabCls = (tab: 'roll' | 'grade' | 'lesson' | 'notes') => (mobileTab === tab ? '' : 'max-lg:hidden');

  const currentCohort = cohorts.find((c) => c.id === activeSessionCohortId) || cohorts[0];
  const cohortStudents = students.filter((s) => s.cohortId === currentCohort?.id && s.isActive !== false);
  const linkedLesson =
    lessonPlans.find((lp) => lp.cohortId === currentCohort?.id) || lessonPlans.find((lp) => !lp.cohortId);
  const todayDate = localDateStr();
  const activeGradingStudent = cohortStudents.find((s) => s.id === (selectedStudentForGrading || cohortStudents[0]?.id));

  // Esc: ask before leaving the cockpit view (the class keeps running in the background)
  useEscapeKey(() => {
    if (window.confirm(language === 'id'
      ? 'Tutup tampilan Kokpit? Sesi tetap berjalan dan dapat dibuka kembali.'
      : 'Close the Cockpit view? The class keeps running and can be reopened.')) {
      setLiveCockpitOpen(false);
    }
  }, isLiveCockpitOpen);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isLiveCockpitOpen) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return; // Don't trigger shortcuts when typing in inputs
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (isStopwatchRunning) {
          pauseLiveSession();
        } else {
          resumeLiveSession();
        }
        return;
      }

      // 1-4: Roll-Call for the highlighted student (Present / Absent / Late / Excused), then advance
      const quick: Record<string, AttendanceStatus> = { '1': 'present', '2': 'absent', '3': 'late', '4': 'excused' };
      const status = quick[e.key];
      if (status && activeGradingStudent && currentCohort && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setAttendance(activeGradingStudent.id, currentCohort.id, todayDate, status);
        const idx = cohortStudents.findIndex((s) => s.id === activeGradingStudent.id);
        const next = cohortStudents[idx + 1];
        if (next) setSelectedStudentForGrading(next.id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLiveCockpitOpen, isStopwatchRunning, pauseLiveSession, resumeLiveSession, activeGradingStudent, currentCohort, cohortStudents, todayDate, setAttendance]);

  // Ticking effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isLiveCockpitOpen && isStopwatchRunning) {
      interval = setInterval(() => {
        tickStopwatch();
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLiveCockpitOpen, isStopwatchRunning, tickStopwatch]);

  if (!isLiveCockpitOpen) return null;

  // Stopwatch format HH:MM:SS
  const formatTime = (secs: number) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const stages = [
    { title: t.liveModal.stageWarmUp, desc: linkedLesson?.warmUp, suggestedMins: '5–10m' },
    { title: t.liveModal.stagePresentation, desc: linkedLesson?.presentation, suggestedMins: '15–20m' },
    { title: t.liveModal.stagePractice, desc: linkedLesson?.practice, suggestedMins: '15–20m' },
    { title: t.liveModal.stageProduction, desc: linkedLesson?.production, suggestedMins: '20–25m' },
    { title: t.liveModal.stageWrapUp, desc: linkedLesson?.wrapUp, suggestedMins: '5–10m' },
  ];

  /** Unrecorded students show no status (never silently "present"). */
  const getStudentStatus = (studentId: string): AttendanceStatus | undefined =>
    attendanceRecords.find((r) => r.studentId === studentId && r.attendanceDate === todayDate)?.status;

  const handleFinish = () => {
    if (window.confirm(language === 'id' ? 'Akhiri sesi mengajar dan simpan klaim honorarium?' : 'Finish teaching session and save claim calculation?')) {
      const savedSession = finishLiveSession(liveScratchpad);
      addToast(
        language === 'id' 
          ? `Sesi selesai! Durasi ${savedSession.durationMinutes} menit tersimpan ke klaim.` 
          : `Session finished! ${savedSession.durationMinutes} mins logged to claims.`,
        'success'
      );
    }
  };

  const activeCohortMilestones = cefrMilestones.filter((m) => m.cefrLevel === currentCohort?.cefrLevel);

  return (
    <div className="fixed inset-0 z-50 scrim backdrop-blur-md flex items-stretch sm:items-center justify-center p-0 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-(--app-paper) w-full max-w-6xl max-sm:rounded-none sm:rounded-3xl shadow-2xl border border-stone-200 flex flex-col max-sm:min-h-full sm:max-h-[94vh] overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Top Control Bar with Large Stopwatch */}
        <div className="theme-original bg-stone-900 text-white px-4 py-3 sm:px-6 sm:py-4 flex flex-wrap items-center justify-between gap-3 sm:gap-4 border-b border-stone-800">
          <div className="flex items-center gap-3 order-1 flex-1 min-w-0 lg:flex-none lg:min-w-fit">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping shrink-0 motion-reduce:animate-none" aria-hidden="true"></span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <h2 className="text-base sm:text-lg font-black tracking-tight truncate">{currentCohort?.name}</h2>
                <span className="px-2 py-0.5 rounded text-[11px] font-black bg-teal-900 text-teal-300 border border-teal-700">
                  CEFR {currentCohort?.cefrLevel}
                </span>
              </div>
              <p className="hidden sm:block text-xs text-stone-300 font-medium mt-0.5 truncate">
                {currentCohort?.roomOrLink} • {linkedLesson?.title || (language === 'id' ? 'Sesi Aktif' : 'Active Session')}
              </p>
            </div>
          </div>

          {/* Large Center Stopwatch Display */}
          <div className="order-3 lg:order-2 w-full lg:w-auto flex items-center justify-between lg:justify-start gap-4 bg-stone-950/90 px-4 sm:px-6 py-2 sm:py-2.5 rounded-2xl border border-stone-800 shadow-inner">
            <div className="text-right">
              <span className="text-[10px] font-bold text-stone-300 uppercase tracking-widest block">
                {t.liveModal.stopwatch}
              </span>
              <span className="text-2xl sm:text-3xl font-mono font-black text-emerald-400 tracking-wider">
                {formatTime(stopwatchSeconds)}
              </span>
            </div>

            {/* Pause / Resume Controls */}
            <div className="flex items-center gap-2 border-l border-stone-800 pl-3">
              {isStopwatchRunning ? (
                <button
                  onClick={pauseLiveSession}
                  className="p-3 sm:p-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 transition-colors cursor-pointer"
                  title={language === 'id' ? 'Jeda stopwatch (pintasan: Spasi)' : 'Pause stopwatch (shortcut: Space)'}
                  aria-label={language === 'id' ? 'Jeda stopwatch' : 'Pause stopwatch'}
                >
                  <Pause className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={resumeLiveSession}
                  className="p-3 sm:p-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 transition-colors cursor-pointer"
                  title={language === 'id' ? 'Lanjutkan stopwatch (pintasan: Spasi)' : 'Resume stopwatch (shortcut: Space)'}
                  aria-label={language === 'id' ? 'Lanjutkan stopwatch' : 'Resume stopwatch'}
                >
                  <Play className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Finish & Exit Buttons */}
          <div className="order-2 lg:order-3 flex items-center gap-2 sm:gap-3">
            <button
              onClick={handleFinish}
              className="flex items-center gap-2 px-3 sm:px-5 py-3 sm:py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{t.liveModal.finish}</span>
            </button>
            <button
              onClick={() => setLiveCockpitOpen(false)}
              className="p-3 sm:p-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors cursor-pointer"
              title={language === 'id' ? 'Tutup tampilan' : 'Close view'}
              aria-label={language === 'id' ? 'Tutup tampilan kokpit' : 'Close cockpit view'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Phone tabs: one section at a time (hidden from lg up) */}
        <div role="tablist" aria-label={language === 'id' ? 'Bagian kokpit' : 'Cockpit sections'} className="lg:hidden grid grid-cols-4 gap-1 p-1.5 bg-stone-100 border-b border-stone-200">
          {([
            ['roll', Users, language === 'id' ? 'Presensi' : 'Roll-call'],
            ['grade', Award, language === 'id' ? 'Nilai' : 'Grading'],
            ['lesson', BookOpen, language === 'id' ? 'Pelajaran' : 'Lesson'],
            ['notes', StickyNote, language === 'id' ? 'Catatan' : 'Notes'],
          ] as const).map(([id, Icon, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={mobileTab === id}
              onClick={() => setMobileTab(id)}
              className={`min-h-12 rounded-xl text-[11px] font-bold flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-teal-700 ${
                mobileTab === id ? 'bg-white text-teal-900 shadow-xs' : 'text-stone-600 hover:bg-stone-200'
              }`}
            >
              <Icon className="w-4 h-4" aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>

        {/* 2-Column Classroom Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 p-3 sm:p-6 overflow-y-auto flex-1">
          
          {/* Left Panel: 1-Click Roll-Call & In-Class Grading (5 Cols) */}
          <div className="lg:col-span-5 space-y-4 flex flex-col">
            
            {/* 1-Click Attendance */}
            <div className={`bg-white rounded-3xl p-4 sm:p-5 border border-stone-200 shadow-xs flex flex-col flex-1 ${tabCls('roll')}`}>
              <div className="flex items-center justify-between mb-3 border-b border-stone-100 pb-2">
                <h3 className="font-extrabold text-stone-900 text-xs uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-teal-700" />
                  {t.cockpit.rollCallTitle} ({cohortStudents.length})
                  <span className="hidden lg:inline ml-2 text-[10px] font-medium text-stone-500" title={language === 'id' ? 'Keyboard: 1 Hadir • 2 Alpa • 3 Terlambat • 4 Izin' : 'Keyboard: 1 Present • 2 Absent • 3 Late • 4 Excused'}>
                    {language === 'id' ? 'Tombol 1–4' : 'Keys 1–4'}
                  </span>
                </h3>
                <button
                  onClick={() => currentCohort && useTeacherStore.getState().batchMarkAllPresent(currentCohort.id, todayDate)}
                  className="text-[11px] font-bold text-teal-800 hover:underline cursor-pointer"
                >
                  {t.cockpit.markAllPresent}
                </button>
              </div>

              <div className="mb-2"><RollCallProgress recorded={cohortStudents.filter((x) => getStudentStatus(x.id) !== undefined).length} total={cohortStudents.length} language={language} /></div>

              <div className="divide-y divide-stone-100 overflow-y-auto lg:max-h-[320px] pr-1 flex-1">
                {cohortStudents.map((st) => {
                  const curStatus = getStudentStatus(st.id);
                  const isGradingSelected = activeGradingStudent?.id === st.id;
                  return (
                    <div key={st.id} className="py-2.5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div 
                        className="truncate min-w-0 cursor-pointer flex items-center gap-2"
                        onClick={() => setSelectedStudentForGrading(st.id)}
                      >
                        <div className={`w-7 h-7 rounded-full text-[10px] font-bold flex items-center justify-center border ${
                          isGradingSelected ? 'bg-teal-800 text-white border-teal-900' : 'bg-stone-100 text-stone-700 border-stone-200'
                        }`}>
                          {st.nickname?.[0] || 'S'}
                        </div>
                        <div className="truncate">
                          <p className={`text-xs font-bold truncate ${isGradingSelected ? 'text-teal-900 underline' : 'text-stone-900'}`}>
                            {st.fullName}
                          </p>
                          <p className="text-[10px] text-stone-400 truncate">{st.nickname}</p>
                        </div>
                      </div>

                      <AttendanceControl
                        value={curStatus}
                        language={language}
                        label={st.fullName}
                        dense
                        compact
                        onChange={(status) => currentCohort && setAttendance(st.id, currentCohort.id, todayDate, status)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* In-Class Quick CEFR Micro-Grading Strip */}
            {activeGradingStudent && activeCohortMilestones.length > 0 && (
              <div className={`bg-white rounded-3xl p-4 border border-stone-200 shadow-xs space-y-2 ${tabCls('grade')}`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold text-teal-800 uppercase tracking-wider flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-teal-700" />
                    {language === 'id' ? 'Penilaian Kilat' : 'Micro-Grading'}: <span className="text-stone-900 font-bold">{activeGradingStudent.nickname}</span>
                  </span>
                  <span className="text-[10px] text-stone-400 font-mono">CEFR {currentCohort?.cefrLevel}</span>
                </div>

                <div className="space-y-2 lg:max-h-[140px] overflow-y-auto pr-1 text-xs">
                  {activeCohortMilestones.slice(0, 2).map((ms) => {
                    const existingEval = studentEvaluations.find((e) => e.studentId === activeGradingStudent.id && e.milestoneId === ms.id);
                    const curScore = existingEval?.competencyScore;

                    return (
                      <div key={ms.id} className="p-2 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between gap-2">
                        <div className="truncate">
                          <span className="text-[10px] font-black text-stone-700 block">{ms.code}</span>
                          <span className="text-[11px] text-stone-600 truncate block">
                            {language === 'id' ? ms.descriptionId : ms.descriptionEn}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {([1, 2, 3, 4] as CompetencyScore[]).map((sc) => (
                            <button
                              key={sc}
                              onClick={() => {
                                setStudentMilestoneScore(activeGradingStudent.id, ms.id, sc);
                                addToast(`${activeGradingStudent.nickname}: Level ${sc}`, 'success');
                              }}
                              aria-label={`${ms.code} → ${sc}`}
                              className={`w-10 h-10 sm:w-7 sm:h-7 rounded-lg text-xs font-black transition-all cursor-pointer ${
                                curScore === sc
                                  ? sc >= 3 ? 'bg-emerald-700 text-white shadow-2xs' : 'bg-amber-700 text-white shadow-2xs'
                                  : 'bg-white hover:bg-stone-200 text-stone-700 border border-stone-200'
                              }`}
                            >
                              {sc}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>

          {/* Right Panel: Active Lesson Stage & Scratchpad (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            
            {/* 5-Stage Interactive Lesson Flow */}
            <div className={`bg-white rounded-3xl p-4 sm:p-6 border border-stone-200 shadow-xs space-y-4 ${tabCls('lesson')}`}>
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-stone-900 text-sm flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-teal-700" />
                  {t.liveModal.activeStage}
                </h3>
                <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-lg border border-teal-100">
                  {linkedLesson?.topic || (language === 'id' ? 'Alur Kurikulum' : 'Curriculum Flow')}
                </span>
              </div>

              {/* Stage Selector Stepper */}
              <div className="grid grid-cols-5 gap-1.5">
                {stages.map((stg, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveStageIndex(i)}
                    className={`p-2.5 min-h-12 rounded-2xl text-center text-xs font-bold transition-all cursor-pointer ${
                      activeStageIndex === i
                        ? 'bg-teal-800 text-white shadow-xs scale-102'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    <span className="block text-[10px] opacity-90">{language === 'id' ? 'Tahap' : 'Stage'} {i + 1}</span>
                    <span className="truncate block text-[11px] mt-0.5">{stg.title.split(' ')[1] || stg.title}</span>
                  </button>
                ))}
              </div>

              {/* Active Stage Content Card */}
              <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-stone-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-teal-700"></span>
                    {stages[activeStageIndex].title}
                  </h4>
                  <span className="text-[10px] font-mono font-bold text-stone-400">
                    {language === 'id' ? 'Saran' : 'Suggested'}: {stages[activeStageIndex].suggestedMins}
                  </span>
                </div>
                <p className="text-xs text-stone-700 leading-relaxed font-medium">
                  {stages[activeStageIndex].desc || (language === 'id' ? 'Ikuti kegiatan kelas yang sudah disiapkan untuk tahap ini.' : 'Follow the prepared classroom activities for this stage.')}
                </p>

                {/* Stage Stepper Prev/Next Buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-stone-200/60">
                  <button
                    onClick={() => setActiveStageIndex(Math.max(0, activeStageIndex - 1))}
                    disabled={activeStageIndex === 0}
                    className="px-3 py-2 rounded-xl text-xs font-bold bg-white border border-stone-200 text-stone-700 hover:bg-stone-100 disabled:opacity-40 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>{language === 'id' ? 'Sebelumnya' : 'Previous'}</span>
                  </button>

                  <button
                    onClick={() => setActiveStageIndex(Math.min(stages.length - 1, activeStageIndex + 1))}
                    disabled={activeStageIndex === stages.length - 1}
                    className="px-3 py-2 rounded-xl text-xs font-bold bg-teal-800 text-white hover:bg-teal-900 disabled:opacity-40 transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                  >
                    <span>{language === 'id' ? 'Tahap Selanjutnya' : 'Next Stage'}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Vocabulary Quick Reference */}
              {linkedLesson?.vocabulary && linkedLesson.vocabulary.length > 0 && (
                <div className="pt-2 border-t border-stone-100">
                  <span className="text-[11px] font-extrabold text-stone-400 uppercase tracking-wider block mb-2">
                    {t.liveModal.vocabBank}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {linkedLesson.vocabulary.map((v, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-stone-100 text-stone-800 border border-stone-200 flex items-center gap-1"
                        title={v.definitionId}
                      >
                        <span className="text-teal-800 font-bold">{v.word}</span>
                        <span className="text-stone-400 text-[10px] font-mono">({v.pos})</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick In-Class Scratchpad Notes */}
            <div className={`bg-white rounded-3xl p-4 sm:p-5 border border-stone-200 shadow-xs flex-1 flex flex-col space-y-2 ${tabCls('notes')}`}>
              <h3 className="font-extrabold text-stone-900 text-xs uppercase tracking-wider flex items-center gap-2">
                <StickyNote className="w-4 h-4 text-amber-700" />
                {t.liveModal.scratchpad}
              </h3>
              <textarea
                value={liveScratchpad}
                onChange={(e) => setLiveScratchpad(e.target.value)}
                placeholder={t.liveModal.scratchpadPlaceholder}
                className="w-full flex-1 min-h-[90px] p-3 text-xs bg-stone-50 border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-700 focus:bg-white text-stone-800 resize-none font-medium"
              />
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
