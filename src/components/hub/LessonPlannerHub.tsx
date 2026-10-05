import React, { useState } from 'react';
import { 
  FileText, Plus, BookOpen, Edit2, Copy, Trash2, 
  Printer, ExternalLink, Search, Layers, CheckCircle2
} from 'lucide-react';
import { useTeacherStore } from '../../store/useTeacherStore';
import { useTranslation } from '../../utils/i18n';
import { LessonPlan } from '../../types';
import { LessonPlanModal } from './LessonPlanModal';
import { PrintableLessonModal } from './PrintableLessonModal';
import { ConfirmModal } from '../common/ConfirmModal';

export const LessonPlannerHub: React.FC = () => {
  const { 
    lessonPlans, selectedLessonPlanId, setSelectedLessonPlanId, 
    deleteLessonPlan, duplicateLessonPlan, cohorts, teacher, language, addToast 
  } = useTeacherStore();
  const t = useTranslation(language);

  const [searchQuery, setSearchQuery] = useState('');
  const [isPlanModalOpen, setPlanModalOpen] = useState(false);
  const [planToEdit, setPlanToEdit] = useState<LessonPlan | null>(null);
  const [isPrintModalOpen, setPrintModalOpen] = useState(false);
  const [confirmDeletePlan, setConfirmDeletePlan] = useState<LessonPlan | null>(null);

  const filteredPlans = lessonPlans.filter((lp) =>
    lp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lp.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lp.cefrLevel.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activePlan = lessonPlans.find((lp) => lp.id === selectedLessonPlanId) || filteredPlans[0] || lessonPlans[0];
  const activeCohort = cohorts.find((c) => c.id === activePlan?.cohortId);

  const stages = [
    { num: 1, name: language === 'id' ? '1. Pemanasan / Apersepsi (Warm-up / Hook)' : 'Stage 1: Warm-up / Hook', duration: '5–10 min', content: activePlan?.warmUp },
    { num: 2, name: language === 'id' ? '2. Penyampaian Materi (Presentation)' : 'Stage 2: Concept Presentation', duration: '15–20 min', content: activePlan?.presentation },
    { num: 3, name: language === 'id' ? '3. Latihan Terpandu (Controlled Practice)' : 'Stage 3: Controlled Practice', duration: '15–20 min', content: activePlan?.practice },
    { num: 4, name: language === 'id' ? '4. Aplikasi Mandiri (Free Production)' : 'Stage 4: Free Production', duration: '20–25 min', content: activePlan?.production },
    { num: 5, name: language === 'id' ? '5. Refleksi & Penutup (Review & Wrap-up)' : 'Stage 5: Review & Wrap-up', duration: '5–10 min', content: activePlan?.wrapUp },
  ];

  const handleOpenAdd = () => {
    setPlanToEdit(null);
    setPlanModalOpen(true);
  };

  const handleOpenEdit = (plan: LessonPlan) => {
    setPlanToEdit(plan);
    setPlanModalOpen(true);
  };

  const handleDuplicate = (planId: string) => {
    duplicateLessonPlan(planId);
    addToast(language === 'id' ? 'RPP berhasil diduplikasi' : 'Lesson plan duplicated', 'success');
  };

  const handleDeleteConfirm = () => {
    if (!confirmDeletePlan) return;
    deleteLessonPlan(confirmDeletePlan.id);
    addToast(language === 'id' ? 'RPP berhasil dihapus' : 'Lesson plan deleted', 'info');
    setConfirmDeletePlan(null);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-150">
      
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
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
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{language === 'id' ? 'Buat RPP Baru' : 'Create Lesson Plan'}</span>
        </button>
      </div>

      {/* Main 2-Column Planner View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Saved Lesson Plans List (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-5 border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-stone-400 uppercase tracking-wider block">
              {language === 'id' ? 'Koleksi RPP' : 'Saved Plans'} ({filteredPlans.length})
            </span>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'id' ? 'Cari judul/topik RPP...' : 'Search plan by title or topic...'}
              className="w-full pl-9 pr-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-teal-700 focus:bg-white text-stone-800 placeholder-stone-400"
            />
          </div>

          <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
            {filteredPlans.length === 0 ? (
              <div className="p-8 text-center text-stone-400 text-xs">
                <p>{language === 'id' ? 'Tidak ada RPP yang sesuai.' : 'No lesson plans found.'}</p>
              </div>
            ) : (
              filteredPlans.map((plan) => {
                const isSelected = plan.id === activePlan?.id;
                return (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedLessonPlanId(plan.id)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-teal-50 border-teal-300 shadow-2xs' 
                        : 'border-stone-200/80 hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-stone-100 text-stone-800 border border-stone-200">
                        CEFR {plan.cefrLevel}
                      </span>
                      <span className="text-[11px] font-semibold text-stone-400 font-mono">
                        {plan.durationMinutes} min
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-stone-900 truncate">{plan.title}</h4>
                    <p className="text-[11px] text-stone-500 truncate mt-0.5">{plan.topic || 'General Lesson'}</p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: 5-Stage Structured Plan Details (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          {!activePlan ? (
            <div className="bg-white rounded-3xl p-12 border border-stone-200 shadow-xs text-center text-stone-400 text-xs">
              <p>{language === 'id' ? 'Pilih atau buat RPP baru.' : 'Select or create a new lesson plan.'}</p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200 shadow-xs space-y-6">
              
              {/* Plan Header Card */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-100 pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                      CEFR {activePlan.cefrLevel} • {activePlan.durationMinutes} Menit
                    </span>
                    {activeCohort && (
                      <span className="text-[10px] font-bold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-md border border-stone-200">
                        {activeCohort.name}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-black text-stone-900 mt-1.5">{activePlan.title}</h3>
                  <p className="text-xs text-stone-500 font-medium">Topik / Tema: {activePlan.topic || '-'}</p>
                </div>

                {/* Plan Toolbar Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPrintModalOpen(true)}
                    className="p-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
                    title="Print / Save PDF (A4 Scaffold)"
                  >
                    <Printer className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDuplicate(activePlan.id)}
                    className="p-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
                    title="Duplicate Lesson Plan"
                  >
                    <Copy className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleOpenEdit(activePlan)}
                    className="p-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
                    title="Edit Lesson Plan"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                    <button
                      onClick={() => setConfirmDeletePlan(activePlan)}
                      className="p-2.5 rounded-xl bg-stone-100 hover:bg-rose-50 text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Delete Lesson Plan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                </div>
              </div>

              {/* Grammar Focus Strip */}
              {activePlan.grammarFocus && (
                <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200/80 flex items-center justify-between text-xs">
                  <span className="font-bold text-stone-700">🎯 Grammar Focus:</span>
                  <span className="font-semibold text-teal-900">{activePlan.grammarFocus}</span>
                </div>
              )}

              {/* 5 Lesson Stages Stack */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-teal-700" />
                  5 Tahap Alur Pembelajaran (Pedagogical Delivery)
                </h4>

                <div className="space-y-2.5">
                  {stages.map((stg) => (
                    <div key={stg.num} className="p-4 rounded-2xl bg-stone-50/70 border border-stone-200/80 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-stone-900 flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-teal-800 text-white text-[10px] font-black flex items-center justify-center">
                            {stg.num}
                          </span>
                          {stg.name}
                        </span>
                        <span className="text-[10px] font-semibold text-stone-400 font-mono">{stg.duration}</span>
                      </div>
                      <p className="text-xs text-stone-600 pl-7 leading-relaxed font-medium">
                        {stg.content || '-'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Vocabulary Table */}
              {activePlan.vocabulary && activePlan.vocabulary.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-extrabold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-teal-700" />
                    Target Vocabulary Bank ({activePlan.vocabulary.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {activePlan.vocabulary.map((vocab, idx) => (
                      <div key={idx} className="p-3 rounded-2xl bg-stone-50 border border-stone-200/80 text-xs space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-teal-900">{vocab.word}</span>
                          <span className="text-[10px] text-stone-400 font-mono">({vocab.pos})</span>
                        </div>
                        <p className="text-[11px] text-stone-600">
                          {language === 'id' ? vocab.definitionId || vocab.definitionEn : vocab.definitionEn}
                        </p>
                        {vocab.example && (
                          <p className="text-[10px] text-stone-400 italic">"{vocab.example}"</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Homework & Resources */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {/* Homework Card */}
                <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200/80 text-xs space-y-1">
                  <span className="font-bold text-amber-900 block flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-700" />
                    Tugas Mandiri (Homework):
                  </span>
                  <p className="text-stone-700">{activePlan.homework || 'Tidak ada tugas tertulis'}</p>
                </div>

                {/* Resource Links Card */}
                <div className="p-4 bg-teal-50/50 rounded-2xl border border-teal-200/80 text-xs space-y-1.5">
                  <span className="font-bold text-teal-900 block flex items-center gap-1">
                    <ExternalLink className="w-3.5 h-3.5 text-teal-700" />
                    Tautan Materi / Worksheet:
                  </span>
                  {activePlan.materialsLinks && activePlan.materialsLinks.length > 0 ? (
                    <div className="space-y-1">
                      {activePlan.materialsLinks.map((link, idx) => (
                        <a
                          key={idx}
                          href={link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-teal-800 hover:text-teal-950 underline truncate block max-w-xs font-mono"
                        >
                          🔗 {link}
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="text-stone-500 text-[11px]">Belum ada tautan materi</p>
                  )}
                </div>
              </div>

            </div>
          )}
        </div>

      </div>

      {/* Lesson Plan Modal (Create / Edit) */}
      <LessonPlanModal
        isOpen={isPlanModalOpen}
        planToEdit={planToEdit}
        onClose={() => {
          setPlanModalOpen(false);
          setPlanToEdit(null);
        }}
      />

      {/* Printable Lesson Scaffold Modal */}
      <PrintableLessonModal
        isOpen={isPrintModalOpen}
        lessonPlan={activePlan}
        teacher={teacher}
        cohortName={activeCohort?.name}
        onClose={() => setPrintModalOpen(false)}
      />

      {/* Confirm Delete Plan Modal */}
      <ConfirmModal
        isOpen={!!confirmDeletePlan}
        title={language === 'id' ? 'Hapus RPP ini?' : 'Delete Lesson Plan?'}
        message={
          language === 'id'
            ? `Apakah Anda yakin ingin menghapus RPP "${confirmDeletePlan?.title}"?`
            : `Are you sure you want to delete "${confirmDeletePlan?.title}"?`
        }
        confirmText={language === 'id' ? 'Ya, Hapus RPP' : 'Yes, Delete Plan'}
        cancelText={language === 'id' ? 'Batal' : 'Cancel'}
        isDangerous={true}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmDeletePlan(null)}
      />

    </div>
  );
};
