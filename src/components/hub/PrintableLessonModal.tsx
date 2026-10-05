import React from 'react';
import { X, Printer, BookOpen, Layers } from 'lucide-react';
import { LessonPlan, Teacher } from '../../types';
import { useEscapeKey } from '../../hooks/useEscapeKey';

interface PrintableLessonModalProps {
  isOpen: boolean;
  lessonPlan: LessonPlan | null;
  teacher: Teacher;
  cohortName?: string;
  onClose: () => void;
}

export const PrintableLessonModal: React.FC<PrintableLessonModalProps> = ({
  isOpen,
  lessonPlan,
  teacher,
  cohortName,
  onClose,
}) => {
  useEscapeKey(onClose, isOpen);

  if (!isOpen || !lessonPlan) return null;

  const handlePrint = () => {
    window.print();
  };

  const stages = [
    { num: 1, name: 'Stage 1: Warm-up / Hook', duration: '5–10 min', content: lessonPlan.warmUp },
    { num: 2, name: 'Stage 2: Concept Presentation', duration: '15–20 min', content: lessonPlan.presentation },
    { num: 3, name: 'Stage 3: Controlled Practice', duration: '15–20 min', content: lessonPlan.practice },
    { num: 4, name: 'Stage 4: Free Production', duration: '20–25 min', content: lessonPlan.production },
    { num: 5, name: 'Stage 5: Review & Wrap-up', duration: '5–10 min', content: lessonPlan.wrapUp },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="print-sheet bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-stone-200 p-6 sm:p-8 space-y-6 max-h-[92vh] overflow-y-auto print:max-w-none print:shadow-none print:border-none print:p-0 print:m-0">
        
        {/* Action Header (Hidden in Print) */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-4 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-sm font-extrabold text-stone-900">Printable Lesson Plan Scaffold (A4)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Sheet Body */}
        <div className="space-y-6 text-stone-900 font-sans">
          
          {/* Top Institutional Header */}
          <div className="border-b-2 border-stone-900 pb-4 flex items-start justify-between">
            <div>
              <h1 className="text-xl font-black tracking-tight">{teacher.schoolName || 'Teaching Academy'}</h1>
              <p className="text-xs text-stone-600 font-medium">Instructor: {teacher.name} • {teacher.email}</p>
            </div>
            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-stone-900 text-white rounded-lg text-xs font-black tracking-wider uppercase">
                CEFR {lessonPlan.cefrLevel}
              </span>
              <p className="text-[11px] text-stone-500 font-mono mt-1">Duration: {lessonPlan.durationMinutes} Mins</p>
            </div>
          </div>

          {/* Title & Meta Info */}
          <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-stone-400 font-bold block text-[10px] uppercase">Lesson Title</span>
              <span className="font-extrabold text-stone-900 text-sm">{lessonPlan.title}</span>
            </div>
            <div>
              <span className="text-stone-400 font-bold block text-[10px] uppercase">Topic / Theme</span>
              <span className="font-bold text-stone-800">{lessonPlan.topic || '-'}</span>
            </div>
            <div>
              <span className="text-stone-400 font-bold block text-[10px] uppercase">Assigned Cohort</span>
              <span className="font-bold text-teal-800">{cohortName || 'General / All Cohorts'}</span>
            </div>
          </div>

          {/* Grammar Focus & Homework */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
              <span className="font-bold text-stone-800 block mb-1">🎯 Grammar Focus:</span>
              <p className="text-stone-600">{lessonPlan.grammarFocus || 'General language practice'}</p>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
              <span className="font-bold text-amber-900 block mb-1">📚 Homework Assignment:</span>
              <p className="text-amber-800">{lessonPlan.homework || 'None assigned'}</p>
            </div>
          </div>

          {/* The 5 Pedagogical Stages */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-stone-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-stone-200 pb-1">
              <Layers className="w-4 h-4 text-teal-700" />
              5-Stage Pedagogical Delivery Flow
            </h3>

            <div className="space-y-2.5">
              {stages.map((stg) => (
                <div key={stg.num} className="p-3 rounded-xl border border-stone-200 text-xs">
                  <div className="flex items-center justify-between font-bold text-stone-900 mb-1">
                    <span>{stg.name}</span>
                    <span className="text-[10px] text-stone-400 font-mono">{stg.duration}</span>
                  </div>
                  <p className="text-stone-700 leading-relaxed">{stg.content || '-'}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Target Vocabulary */}
          {lessonPlan.vocabulary && lessonPlan.vocabulary.length > 0 && (
            <div className="space-y-2 pt-2">
              <h3 className="text-xs font-black text-stone-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-stone-200 pb-1">
                <BookOpen className="w-4 h-4 text-teal-700" />
                Target Vocabulary Bank
              </h3>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {lessonPlan.vocabulary.map((vocab, idx) => (
                  <div key={idx} className="p-2.5 bg-stone-50 rounded-lg border border-stone-200">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-teal-900">{vocab.word}</span>
                      <span className="text-[10px] text-stone-400 font-mono">({vocab.pos})</span>
                    </div>
                    <p className="text-[11px] text-stone-600 mt-0.5">{vocab.definitionId || vocab.definitionEn}</p>
                    {vocab.example && (
                      <p className="text-[10px] text-stone-400 italic mt-0.5">"{vocab.example}"</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Teacher Signature Line */}
          <div className="pt-8 flex justify-between text-xs text-stone-400">
            <div>
              <p>Prepared By: {teacher.name}</p>
              <div className="w-36 border-b border-stone-300 mt-8"></div>
            </div>
            <div className="text-right">
              <p>Academic Approval:</p>
              <div className="w-36 border-b border-stone-300 mt-8 ml-auto"></div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
