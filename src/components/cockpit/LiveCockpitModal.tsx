import React, { useState, useEffect } from 'react';
import { 
  X, Play, Pause, CheckCircle2, 
  BookOpen, Users, StickyNote
} from 'lucide-react';
import { useTeacherStore } from '../../store/useTeacherStore';
import { useTranslation } from '../../utils/i18n';
import { AttendanceStatus } from '../../types';

export const LiveCockpitModal: React.FC = () => {
  const { 
    isLiveCockpitOpen, setLiveCockpitOpen, activeSessionCohortId,
    cohorts, students, lessonPlans, attendanceRecords, setAttendance,
    stopwatchSeconds, isStopwatchRunning, pauseLiveSession, resumeLiveSession,
    tickStopwatch, finishLiveSession, language 
  } = useTeacherStore();
  const t = useTranslation(language);

  const [activeStageIndex, setActiveStageIndex] = useState(2); // Start on practice
  const [scratchpadText, setScratchpadText] = useState('');

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

  const currentCohort = cohorts.find((c) => c.id === activeSessionCohortId) || cohorts[0];
  const cohortStudents = students.filter((s) => s.cohortId === currentCohort?.id);
  const linkedLesson = lessonPlans.find((lp) => lp.cohortId === currentCohort?.id) || lessonPlans[0];
  const todayDate = new Date().toISOString().split('T')[0];

  // Stopwatch format HH:MM:SS
  const formatTime = (secs: number) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const stages = [
    { title: t.liveModal.stageWarmUp, desc: linkedLesson?.warmUp },
    { title: t.liveModal.stagePresentation, desc: linkedLesson?.presentation },
    { title: t.liveModal.stagePractice, desc: linkedLesson?.practice },
    { title: t.liveModal.stageProduction, desc: linkedLesson?.production },
    { title: t.liveModal.stageWrapUp, desc: linkedLesson?.wrapUp },
  ];

  const getStudentStatus = (studentId: string): AttendanceStatus => {
    const record = attendanceRecords.find(
      (r) => r.studentId === studentId && r.attendanceDate === todayDate
    );
    return record?.status || 'present';
  };

  const statusOptions: { key: AttendanceStatus; label: string; activeClass: string; inactiveClass: string }[] = [
    { key: 'present', label: 'Hadir (H)', activeClass: 'bg-emerald-600 text-white font-bold shadow-xs', inactiveClass: 'bg-stone-100 text-stone-600 hover:bg-stone-200' },
    { key: 'absent', label: 'Alpa (A)', activeClass: 'bg-rose-600 text-white font-bold shadow-xs', inactiveClass: 'bg-stone-100 text-stone-600 hover:bg-stone-200' },
    { key: 'late', label: 'Terlambat (T)', activeClass: 'bg-amber-600 text-white font-bold shadow-xs', inactiveClass: 'bg-stone-100 text-stone-600 hover:bg-stone-200' },
    { key: 'excused', label: 'Izin (I)', activeClass: 'bg-sky-600 text-white font-bold shadow-xs', inactiveClass: 'bg-stone-100 text-stone-600 hover:bg-stone-200' },
  ];

  const handleFinish = () => {
    if (window.confirm(language === 'id' ? 'Akhiri sesi mengajar dan simpan klaim honorarium?' : 'Finish teaching session and save claim calculation?')) {
      finishLiveSession(scratchpadText);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-[#F8F9FA] w-full max-w-6xl rounded-3xl shadow-2xl border border-stone-200 flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Top Control Bar with Large Stopwatch */}
        <div className="bg-stone-900 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-stone-800">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold tracking-tight">{currentCohort?.name}</h2>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-teal-900 text-teal-300 border border-teal-700">
                  CEFR {currentCohort?.cefrLevel}
                </span>
              </div>
              <p className="text-xs text-stone-400 font-medium mt-0.5">
                {currentCohort?.roomOrLink} • {linkedLesson?.title}
              </p>
            </div>
          </div>

          {/* Large Center Stopwatch Display */}
          <div className="flex items-center gap-4 bg-stone-950/90 px-5 py-2 rounded-2xl border border-stone-800 shadow-inner">
            <div className="text-right">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block">
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
                  className="p-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 transition-colors"
                  title="Pause Stopwatch"
                >
                  <Pause className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={resumeLiveSession}
                  className="p-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 transition-colors"
                  title="Resume Stopwatch"
                >
                  <Play className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Finish & Exit Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleFinish}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{t.liveModal.finish}</span>
            </button>
            <button
              onClick={() => setLiveCockpitOpen(false)}
              className="p-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors"
              title="Close View"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2-Column Classroom Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 overflow-y-auto flex-1">
          
          {/* Left Panel: 1-Click Roll-Call (5 Cols) */}
          <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-stone-200 shadow-xs flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-stone-900 text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-teal-700" />
                {t.cockpit.rollCallTitle} ({cohortStudents.length})
              </h3>
              <button
                onClick={() => currentCohort && useTeacherStore.getState().batchMarkAllPresent(currentCohort.id, todayDate)}
                className="text-[11px] font-bold text-teal-800 hover:underline"
              >
                {t.cockpit.markAllPresent}
              </button>
            </div>

            <div className="divide-y divide-stone-100 overflow-y-auto max-h-[420px] pr-1 flex-1">
              {cohortStudents.map((st) => {
                const curStatus = getStudentStatus(st.id);
                return (
                  <div key={st.id} className="py-2.5 flex items-center justify-between gap-2">
                    <div className="truncate min-w-0">
                      <p className="text-xs font-bold text-stone-900 truncate">{st.fullName}</p>
                      <p className="text-[10px] text-stone-400 truncate">{st.nickname}</p>
                    </div>

                    <div className="flex items-center gap-1 bg-stone-100 p-0.5 rounded-lg border border-stone-200 shrink-0">
                      {statusOptions.map((opt) => (
                        <button
                          key={opt.key}
                          onClick={() => currentCohort && setAttendance(st.id, currentCohort.id, todayDate, opt.key)}
                          className={`px-2 py-1 rounded text-[11px] transition-all cursor-pointer ${
                            curStatus === opt.key ? opt.activeClass : opt.inactiveClass
                          }`}
                        >
                          {opt.label.split(' ')[1] || opt.label[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Panel: Active Lesson Stage & Scratchpad (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            
            {/* 5-Stage Interactive Lesson Flow */}
            <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-extrabold text-stone-900 text-sm flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-teal-700" />
                  {t.liveModal.activeStage}
                </h3>
                <span className="text-xs font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100">
                  {linkedLesson?.topic}
                </span>
              </div>

              {/* Stage Selector Pills */}
              <div className="grid grid-cols-5 gap-1.5 mb-4">
                {stages.map((stg, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveStageIndex(i)}
                    className={`p-2 rounded-xl text-center text-xs font-bold transition-all ${
                      activeStageIndex === i
                        ? 'bg-teal-800 text-white shadow-xs scale-102'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    <span className="block text-[10px] opacity-70">Stage {i + 1}</span>
                    <span className="truncate block text-[11px]">{stg.title.split(' ')[1] || stg.title}</span>
                  </button>
                ))}
              </div>

              {/* Stage Content Card */}
              <div className="bg-stone-50 rounded-xl p-4 border border-stone-200">
                <h4 className="text-xs font-bold text-stone-800 mb-1 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-teal-700"></span>
                  {stages[activeStageIndex].title}
                </h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  {stages[activeStageIndex].desc || 'Follow the prepared classroom activities for this stage.'}
                </p>
              </div>

              {/* Vocabulary Quick Reference */}
              {linkedLesson?.vocabulary && linkedLesson.vocabulary.length > 0 && (
                <div className="mt-4 pt-3 border-t border-stone-100">
                  <span className="text-[11px] font-extrabold text-stone-400 uppercase tracking-wider block mb-2">
                    {t.liveModal.vocabBank}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {linkedLesson.vocabulary.map((v, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-stone-100 text-stone-800 border border-stone-200 flex items-center gap-1"
                        title={v.definitionId}
                      >
                        <span className="text-teal-800 font-bold">{v.word}</span>
                        <span className="text-stone-400 text-[10px]">({v.pos})</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick In-Class Scratchpad Notes */}
            <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs flex-1 flex flex-col">
              <h3 className="font-extrabold text-stone-900 text-sm flex items-center gap-2 mb-2">
                <StickyNote className="w-4 h-4 text-amber-600" />
                {t.liveModal.scratchpad}
              </h3>
              <textarea
                value={scratchpadText}
                onChange={(e) => setScratchpadText(e.target.value)}
                placeholder={t.liveModal.scratchpadPlaceholder}
                className="w-full flex-1 min-h-[100px] p-3 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-700 focus:bg-white text-stone-800 resize-none"
              />
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
