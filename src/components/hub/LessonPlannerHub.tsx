import React from 'react';
import { FileText, Plus, BookOpen } from 'lucide-react';
import { useTeacherStore } from '../../store/useTeacherStore';
import { useTranslation } from '../../utils/i18n';

export const LessonPlannerHub: React.FC = () => {
  const { lessonPlans, selectedLessonPlanId, setSelectedLessonPlanId, language } = useTeacherStore();
  const t = useTranslation(language);

  const activePlan = lessonPlans.find((lp) => lp.id === selectedLessonPlanId) || lessonPlans[0];

  const stages = [
    { num: 1, name: language === 'id' ? 'Pemanasan / Apersepsi' : 'Warm-up / Hook', duration: '5–10 min', content: activePlan?.warmUp },
    { num: 2, name: language === 'id' ? 'Penyampaian Materi' : 'Presentation', duration: '15–20 min', content: activePlan?.presentation },
    { num: 3, name: language === 'id' ? 'Latihan Terpandu' : 'Controlled Practice', duration: '15–20 min', content: activePlan?.practice },
    { num: 4, name: language === 'id' ? 'Aplikasi Mandiri' : 'Free Production', duration: '20–25 min', content: activePlan?.production },
    { num: 5, name: language === 'id' ? 'Refleksi & Penutup' : 'Review & Wrap-up', duration: '5–10 min', content: activePlan?.wrapUp },
  ];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-150">
      
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-stone-900 tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-700" />
            {t.nav.lessonPlanner}
          </h2>
          <p className="text-xs text-stone-500 font-medium mt-0.5">
            {language === 'id' 
              ? 'Rancang skenario pembelajaran 5-tahap, bank kosakata, dan tugas mandiri.' 
              : 'Design structured 5-stage pedagogical lesson scaffolds, vocab banks, and homework.'}
          </p>
        </div>

        <button 
          onClick={() => useTeacherStore.getState().addToast('Create Lesson Plan form is coming soon!', 'info')}
          className="px-4 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t.hubs.createNew}</span>
        </button>
      </div>

      {/* Main 2-Column Planner View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Saved Lesson Plans list (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-5 border border-stone-200 shadow-xs space-y-3">
          <span className="text-[11px] font-extrabold text-stone-400 uppercase tracking-wider block">
            {language === 'id' ? 'Koleksi RPP Tersimpan' : 'Saved Lesson Plans'}
          </span>

          <div className="space-y-2">
            {lessonPlans.map((plan) => {
              const isSelected = plan.id === activePlan?.id;
              return (
                <div
                  key={plan.id}
                  onClick={() => setSelectedLessonPlanId(plan.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected ? 'bg-teal-50 border-teal-300 shadow-xs' : 'border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-stone-100 text-stone-700 border border-stone-200">
                      CEFR {plan.cefrLevel}
                    </span>
                    <span className="text-[11px] font-semibold text-stone-400">{plan.durationMinutes} min</span>
                  </div>
                  <h4 className="text-xs font-bold text-stone-900 truncate">{plan.title}</h4>
                  <p className="text-[11px] text-stone-500 truncate mt-0.5">{plan.topic}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: 5-Stage Structured Plan Details (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          
          {/* Plan Header Card */}
          <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-4">
              <div>
                <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100">
                  CEFR {activePlan?.cefrLevel} • {activePlan?.durationMinutes} Minutes
                </span>
                <h3 className="text-lg font-extrabold text-stone-900 mt-1">{activePlan?.title}</h3>
                <p className="text-xs text-stone-500 font-medium">Topic: {activePlan?.topic}</p>
              </div>

              <span className="text-xs font-bold text-stone-600 bg-stone-100 px-3 py-1.5 rounded-xl">
                Grammar: {activePlan?.grammarFocus}
              </span>
            </div>

            {/* 5 Lesson Stages Stack */}
            <div className="space-y-3">
              {stages.map((stg) => (
                <div key={stg.num} className="p-4 rounded-xl bg-stone-50/70 border border-stone-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-stone-900 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-teal-800 text-white text-[10px] font-black flex items-center justify-center">
                        {stg.num}
                      </span>
                      {stg.name}
                    </span>
                    <span className="text-[10px] font-semibold text-stone-400">{stg.duration}</span>
                  </div>
                  <p className="text-xs text-stone-600 pl-7 leading-relaxed">{stg.content}</p>
                </div>
              ))}
            </div>

            {/* Vocabulary Table */}
            {activePlan?.vocabulary && (
              <div className="mt-5 pt-4 border-t border-stone-100">
                <h4 className="text-xs font-bold text-stone-900 mb-2 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-teal-700" />
                  Target Vocabulary
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {activePlan.vocabulary.map((vocab, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-stone-100/70 border border-stone-200 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-teal-900">{vocab.word}</span>
                        <span className="text-[10px] text-stone-400">({vocab.pos})</span>
                      </div>
                      <p className="text-[11px] text-stone-600 mt-0.5">
                        {language === 'id' ? vocab.definitionId : vocab.definitionEn}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Homework Assignment */}
            <div className="mt-4 p-3 bg-amber-50/60 rounded-xl border border-amber-200 text-xs">
              <span className="font-bold text-amber-900 block mb-0.5">Homework Assignment:</span>
              <p className="text-stone-700">{activePlan?.homework}</p>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
