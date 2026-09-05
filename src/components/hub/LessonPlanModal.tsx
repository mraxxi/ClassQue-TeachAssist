import React, { useState, useEffect } from 'react';
import { 
  X, FileText, Plus, Trash2, BookOpen, 
  Award, Clock, Layers, Link as LinkIcon
} from 'lucide-react';
import { LessonPlan, CEFRLevel, VocabularyItem } from '../../types';
import { useTeacherStore } from '../../store/facade';

interface LessonPlanModalProps {
  isOpen: boolean;
  planToEdit?: LessonPlan | null;
  onClose: () => void;
}

const CEFR_LEVELS: CEFRLevel[] = ['Pre-A1', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export const LessonPlanModal: React.FC<LessonPlanModalProps> = ({
  isOpen,
  planToEdit,
  onClose,
}) => {
  const { teacher, cohorts, addLessonPlan, updateLessonPlan, addToast, language } = useTeacherStore();

  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [cefrLevel, setCefrLevel] = useState<CEFRLevel>('A2');
  const [cohortId, setCohortId] = useState<string>('');
  const [durationMinutes, setDurationMinutes] = useState(60);

  // 5 Pedagogical Stages
  const [warmUp, setWarmUp] = useState('');
  const [presentation, setPresentation] = useState('');
  const [practice, setPractice] = useState('');
  const [production, setProduction] = useState('');
  const [wrapUp, setWrapUp] = useState('');

  // Vocabulary & Grammar
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
  const [grammarFocus, setGrammarFocus] = useState('');
  const [homework, setHomework] = useState('');
  
  // Materials / Links
  const [materialsLinks, setMaterialsLinks] = useState<string[]>([]);
  const [newLinkInput, setNewLinkInput] = useState('');

  useEffect(() => {
    if (planToEdit) {
      setTitle(planToEdit.title);
      setTopic(planToEdit.topic || '');
      setCefrLevel(planToEdit.cefrLevel || 'A2');
      setCohortId(planToEdit.cohortId || '');
      setDurationMinutes(planToEdit.durationMinutes || 60);
      setWarmUp(planToEdit.warmUp || '');
      setPresentation(planToEdit.presentation || '');
      setPractice(planToEdit.practice || '');
      setProduction(planToEdit.production || '');
      setWrapUp(planToEdit.wrapUp || '');
      setVocabulary(planToEdit.vocabulary ? [...planToEdit.vocabulary] : []);
      setGrammarFocus(planToEdit.grammarFocus || '');
      setHomework(planToEdit.homework || '');
      setMaterialsLinks(planToEdit.materialsLinks ? [...planToEdit.materialsLinks] : []);
    } else {
      setTitle('');
      setTopic('');
      setCefrLevel('A2');
      setCohortId(cohorts[0]?.id || '');
      setDurationMinutes(60);
      setWarmUp('Flashcard guessing game (5 mins) to activate schema and vocabulary.');
      setPresentation('Introduce key concept and grammar rules with interactive board examples.');
      setPractice('Guided worksheet in pairs. Complete sentences with target vocabulary.');
      setProduction('Independent output: create short dialogue or write 4 descriptive sentences.');
      setWrapUp('Exit ticket recap: each student states 1 new word learned today.');
      setVocabulary([
        { word: 'example', pos: 'noun', definitionEn: 'A representative form or pattern', definitionId: 'Contoh / teladan', example: 'This is an example sentence.' }
      ]);
      setGrammarFocus('Simple Present / Past Tense focus');
      setHomework('Activity Book page 12 (Exercises 1-3)');
      setMaterialsLinks([]);
    }
  }, [planToEdit, cohorts, isOpen]);

  if (!isOpen) return null;

  const handleAddVocabItem = () => {
    setVocabulary([
      ...vocabulary,
      { word: '', pos: 'noun', definitionEn: '', definitionId: '', example: '' }
    ]);
  };

  const handleUpdateVocabItem = (index: number, field: keyof VocabularyItem, val: string) => {
    const updated = [...vocabulary];
    updated[index] = { ...updated[index], [field]: val };
    setVocabulary(updated);
  };

  const handleRemoveVocabItem = (index: number) => {
    setVocabulary(vocabulary.filter((_, idx) => idx !== index));
  };

  const handleAddLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLinkInput.trim()) return;
    setMaterialsLinks([...materialsLinks, newLinkInput.trim()]);
    setNewLinkInput('');
  };

  const handleRemoveLink = (index: number) => {
    setMaterialsLinks(materialsLinks.filter((_, idx) => idx !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      addToast(language === 'id' ? 'Judul RPP wajib diisi!' : 'Lesson plan title is required!', 'warning');
      return;
    }

    if (planToEdit) {
      updateLessonPlan(planToEdit.id, {
        title: title.trim(),
        topic: topic.trim(),
        cefrLevel,
        cohortId: cohortId || undefined,
        durationMinutes,
        warmUp: warmUp.trim(),
        presentation: presentation.trim(),
        practice: practice.trim(),
        production: production.trim(),
        wrapUp: wrapUp.trim(),
        vocabulary: vocabulary.filter((v) => v.word.trim()),
        grammarFocus: grammarFocus.trim(),
        materialsLinks,
        homework: homework.trim(),
      });
      addToast(language === 'id' ? 'RPP berhasil diperbarui!' : 'Lesson plan updated successfully!', 'success');
    } else {
      const newPlan: LessonPlan = {
        id: `lesson-${Date.now()}`,
        teacherId: teacher.id,
        cohortId: cohortId || undefined,
        title: title.trim(),
        topic: topic.trim() || 'General Lesson',
        cefrLevel,
        durationMinutes,
        warmUp: warmUp.trim(),
        presentation: presentation.trim(),
        practice: practice.trim(),
        production: production.trim(),
        wrapUp: wrapUp.trim(),
        vocabulary: vocabulary.filter((v) => v.word.trim()),
        grammarFocus: grammarFocus.trim(),
        materialsLinks,
        homework: homework.trim(),
        isTemplate: false,
      };
      addLessonPlan(newPlan);
      addToast(language === 'id' ? 'RPP baru berhasil dibuat!' : 'New lesson plan created successfully!', 'success');
    }

    onClose();
  };

  const isEditing = !!planToEdit;

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-stone-200 p-6 sm:p-8 space-y-6 animate-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-teal-800 text-white flex items-center justify-center shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-stone-900 tracking-tight">
                {isEditing
                  ? (language === 'id' ? 'Edit Rencana Pembelajaran (RPP)' : 'Edit Lesson Plan Scaffold')
                  : (language === 'id' ? 'Rancang Rencana Pembelajaran (RPP)' : 'Create Structured Lesson Plan')}
              </h3>
              <p className="text-xs text-stone-500 font-medium">
                {language === 'id'
                  ? 'Format 5-tahap pedagogis (Warm-up ➔ Presentation ➔ Practice ➔ Production ➔ Wrap-up).'
                  : '5-stage pedagogical scaffolding with target vocabularies and grammar.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 p-2 rounded-xl hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Basic Information */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold text-stone-900 uppercase tracking-wider">
              1. {language === 'id' ? 'Informasi Utama Pembelajaran' : 'Lesson Overview'}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-8">
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {language === 'id' ? 'Judul RPP / Modul' : 'Lesson Plan Title'} *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Unit 4: Prehistoric Animals & Past Events"
                  className="w-full px-3.5 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-teal-700 focus:bg-white text-stone-800 font-bold"
                />
              </div>

              <div className="sm:col-span-4">
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {language === 'id' ? 'Target Kelas / Rombel' : 'Cohort (Optional)'}
                </label>
                <select
                  value={cohortId}
                  onChange={(e) => setCohortId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-teal-700 focus:bg-white text-stone-800"
                >
                  <option value="">{language === 'id' ? '(Semua Kelas / Umum)' : '(All Cohorts / General)'}</option>
                  {cohorts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.cefrLevel})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {language === 'id' ? 'Topik / Tema' : 'Topic / Theme'}
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Dinosaurs & Fossils"
                  className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-teal-700 focus:bg-white text-stone-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                  <Award className="w-3 h-3 text-teal-700" />
                  {language === 'id' ? 'Tingkat CEFR' : 'CEFR Level'}
                </label>
                <select
                  value={cefrLevel}
                  onChange={(e) => setCefrLevel(e.target.value as CEFRLevel)}
                  className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-teal-700 focus:bg-white text-stone-800 font-bold"
                >
                  {CEFR_LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      CEFR {lvl}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-teal-700" />
                  {language === 'id' ? 'Durasi (Menit)' : 'Duration (Minutes)'}
                </label>
                <select
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(parseInt(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-teal-700 focus:bg-white text-stone-800"
                >
                  <option value={45}>45 Menit</option>
                  <option value={60}>60 Menit (1 Jam)</option>
                  <option value={90}>90 Menit (1.5 Jam)</option>
                  <option value={120}>120 Menit (2 Jam)</option>
                </select>
              </div>
            </div>
          </div>

          {/* 5 Pedagogical Stages */}
          <div className="space-y-3 pt-3 border-t border-stone-100">
            <h4 className="text-xs font-extrabold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-teal-700" />
              2. {language === 'id' ? '5 Tahap Pembelajaran Pedagogis' : '5 Pedagogical Stages Scaffolding'}
            </h4>

            {/* Stage 1 */}
            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-1">
              <span className="text-xs font-bold text-stone-900 flex items-center justify-between">
                <span>1. {language === 'id' ? 'Pemanasan / Apersepsi (Warm-up / Hook)' : 'Stage 1: Warm-up / Hook'}</span>
                <span className="text-[10px] text-stone-400 font-semibold">5–10 min</span>
              </span>
              <textarea
                rows={2}
                value={warmUp}
                onChange={(e) => setWarmUp(e.target.value)}
                placeholder="Deskripsi kegiatan apersepsi / ice breaker..."
                className="w-full px-3 py-1.5 text-xs bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-teal-700 text-stone-800"
              />
            </div>

            {/* Stage 2 */}
            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-1">
              <span className="text-xs font-bold text-stone-900 flex items-center justify-between">
                <span>2. {language === 'id' ? 'Penyampaian Materi (Presentation)' : 'Stage 2: Concept Presentation'}</span>
                <span className="text-[10px] text-stone-400 font-semibold">15–20 min</span>
              </span>
              <textarea
                rows={2}
                value={presentation}
                onChange={(e) => setPresentation(e.target.value)}
                placeholder="Penjelasan materi / pengenalan grammar / kosakata baru..."
                className="w-full px-3 py-1.5 text-xs bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-teal-700 text-stone-800"
              />
            </div>

            {/* Stage 3 */}
            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-1">
              <span className="text-xs font-bold text-stone-900 flex items-center justify-between">
                <span>3. {language === 'id' ? 'Latihan Terpandu (Controlled Practice)' : 'Stage 3: Controlled Practice'}</span>
                <span className="text-[10px] text-stone-400 font-semibold">15–20 min</span>
              </span>
              <textarea
                rows={2}
                value={practice}
                onChange={(e) => setPractice(e.target.value)}
                placeholder="Latihan terbimbing, matching worksheet, drill berpasangan..."
                className="w-full px-3 py-1.5 text-xs bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-teal-700 text-stone-800"
              />
            </div>

            {/* Stage 4 */}
            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-1">
              <span className="text-xs font-bold text-stone-900 flex items-center justify-between">
                <span>4. {language === 'id' ? 'Aplikasi Mandiri (Free Production)' : 'Stage 4: Free Production'}</span>
                <span className="text-[10px] text-stone-400 font-semibold">20–25 min</span>
              </span>
              <textarea
                rows={2}
                value={production}
                onChange={(e) => setProduction(e.target.value)}
                placeholder="Praktik berbicara bebas, menulis kreatif, roleplay kelompok..."
                className="w-full px-3 py-1.5 text-xs bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-teal-700 text-stone-800"
              />
            </div>

            {/* Stage 5 */}
            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-1">
              <span className="text-xs font-bold text-stone-900 flex items-center justify-between">
                <span>5. {language === 'id' ? 'Refleksi & Penutup (Review & Wrap-up)' : 'Stage 5: Review & Wrap-up'}</span>
                <span className="text-[10px] text-stone-400 font-semibold">5–10 min</span>
              </span>
              <textarea
                rows={2}
                value={wrapUp}
                onChange={(e) => setWrapUp(e.target.value)}
                placeholder="Exit ticket, kesimpulan pembelajaran, review kosakata..."
                className="w-full px-3 py-1.5 text-xs bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-teal-700 text-stone-800"
              />
            </div>
          </div>

          {/* Vocabulary Bank Builder */}
          <div className="space-y-3 pt-3 border-t border-stone-100">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-teal-700" />
                3. {language === 'id' ? 'Bank Kosakata Target' : 'Target Vocabulary Bank'} ({vocabulary.length})
              </h4>
              <button
                type="button"
                onClick={handleAddVocabItem}
                className="px-3 py-1 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>{language === 'id' ? 'Tambah Kata' : 'Add Word'}</span>
              </button>
            </div>

            <div className="space-y-2">
              {vocabulary.map((v, idx) => (
                <div key={idx} className="p-3 bg-stone-50 rounded-2xl border border-stone-200 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                  <div className="sm:col-span-3">
                    <input
                      type="text"
                      value={v.word}
                      onChange={(e) => handleUpdateVocabItem(idx, 'word', e.target.value)}
                      placeholder="Word (e.g. fossil)"
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-stone-200 rounded-lg font-bold text-stone-900"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <select
                      value={v.pos}
                      onChange={(e) => handleUpdateVocabItem(idx, 'pos', e.target.value)}
                      className="w-full px-2 py-1.5 text-xs bg-white border border-stone-200 rounded-lg text-stone-700 font-mono"
                    >
                      <option value="noun">noun</option>
                      <option value="verb">verb</option>
                      <option value="adj">adj</option>
                      <option value="adv">adv</option>
                      <option value="phr">phrase</option>
                    </select>
                  </div>
                  <div className="sm:col-span-3">
                    <input
                      type="text"
                      value={v.definitionId}
                      onChange={(e) => handleUpdateVocabItem(idx, 'definitionId', e.target.value)}
                      placeholder="Definisi (ID)"
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-stone-200 rounded-lg text-stone-700"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <input
                      type="text"
                      value={v.example}
                      onChange={(e) => handleUpdateVocabItem(idx, 'example', e.target.value)}
                      placeholder="Example sentence..."
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-stone-200 rounded-lg text-stone-700"
                    />
                  </div>
                  <div className="sm:col-span-1 text-right">
                    <button
                      type="button"
                      onClick={() => handleRemoveVocabItem(idx)}
                      className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg"
                      title="Remove word"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Grammar Focus & Homework */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-stone-100">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                {language === 'id' ? 'Fokus Tata Bahasa (Grammar Focus)' : 'Grammar Focus'}
              </label>
              <input
                type="text"
                value={grammarFocus}
                onChange={(e) => setGrammarFocus(e.target.value)}
                placeholder="e.g. Past Simple with irregular verbs"
                className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-teal-700 text-stone-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                {language === 'id' ? 'Tugas Mandiri (Homework)' : 'Homework Assignment'}
              </label>
              <input
                type="text"
                value={homework}
                onChange={(e) => setHomework(e.target.value)}
                placeholder="e.g. Activity Book page 18"
                className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-teal-700 text-stone-800"
              />
            </div>
          </div>

          {/* Material / PDF Resource Links Vault */}
          <div className="space-y-2 pt-3 border-t border-stone-100">
            <label className="block text-xs font-bold text-stone-700 flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-teal-700" />
              {language === 'id' ? 'Tautan Materi / Worksheet Vault' : 'Resource Links / Worksheet Vault'}
            </label>

            <div className="flex gap-2">
              <input
                type="url"
                value={newLinkInput}
                onChange={(e) => setNewLinkInput(e.target.value)}
                placeholder="https://drive.google.com/... or https://youtube.com/..."
                className="flex-1 px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-teal-700 text-stone-800"
              />
              <button
                type="button"
                onClick={handleAddLink}
                className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                + {language === 'id' ? 'Tambah Tautan' : 'Add Link'}
              </button>
            </div>

            {materialsLinks.length > 0 && (
              <div className="space-y-1.5 pt-1">
                {materialsLinks.map((link, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-700">
                    <span className="truncate max-w-md font-mono text-[11px] text-teal-800">{link}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveLink(idx)}
                      className="text-stone-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-stone-600 bg-stone-100 hover:bg-stone-200 transition-colors cursor-pointer"
            >
              {language === 'id' ? 'Batal' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
            >
              {isEditing
                ? (language === 'id' ? 'Simpan RPP' : 'Save Lesson Plan')
                : (language === 'id' ? 'Buat RPP' : 'Create Lesson Plan')}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
