import React, { useState } from 'react';
import { 
  Award, Filter, CheckCircle2, Star, 
  FileEdit, X, Sparkles, BookOpen, MessageSquare
} from 'lucide-react';
import { Cohort, Student, SkillCategory, CEFRLevel, CompetencyScore } from '../../types';
import { useTeacherStore } from '../../store/facade';

interface CefrGradebookTabProps {
  activeCohort: Cohort;
  cohortStudents: Student[];
  selectedStudent: Student | null;
  onSelectStudent: (student: Student) => void;
}

const SKILLS: { key: SkillCategory | 'all'; labelEn: string; labelId: string }[] = [
  { key: 'all', labelEn: 'All Skills', labelId: 'Semua Keterampilan' },
  { key: 'listening', labelEn: 'Listening', labelId: 'Mendengarkan' },
  { key: 'reading', labelEn: 'Reading', labelId: 'Membaca' },
  { key: 'spoken_interaction', labelEn: 'Spoken Interaction', labelId: 'Interaksi Lisan' },
  { key: 'spoken_production', labelEn: 'Spoken Production', labelId: 'Produksi Lisan' },
  { key: 'writing', labelEn: 'Writing', labelId: 'Menulis' },
];

export const CefrGradebookTab: React.FC<CefrGradebookTabProps> = ({
  activeCohort,
  cohortStudents,
  selectedStudent,
  onSelectStudent,
}) => {
  const { 
    cefrMilestones, studentEvaluations, setStudentMilestoneScore, 
    language, addToast 
  } = useTeacherStore();

  const [selectedSkill, setSelectedSkill] = useState<SkillCategory | 'all'>('all');
  const [selectedLevel, setSelectedLevel] = useState<CEFRLevel | 'all'>(activeCohort?.cefrLevel || 'all');
  
  // Note edit state
  const [editingNoteMilestoneId, setEditingNoteMilestoneId] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState<string>('');

  const currentStudent = selectedStudent || cohortStudents[0];

  // Filter milestones
  const filteredMilestones = cefrMilestones.filter((ms) => {
    const matchSkill = selectedSkill === 'all' || ms.skillCategory === selectedSkill;
    const matchLevel = selectedLevel === 'all' || ms.cefrLevel === selectedLevel;
    return matchSkill && matchLevel;
  });

  // Competency level definitions
  const competencyLevels: { score: CompetencyScore; shortLabel: string; fullEn: string; fullId: string; activeClass: string; badgeClass: string }[] = [
    { score: 1, shortLabel: '1 • MB', fullEn: 'Emerging', fullId: 'Mulai Berkembang (MB)', activeClass: 'bg-amber-600 text-white shadow-xs', badgeClass: 'bg-amber-100 text-amber-800' },
    { score: 2, shortLabel: '2 • SB', fullEn: 'Developing', fullId: 'Sedang Berkembang (SB)', activeClass: 'bg-sky-600 text-white shadow-xs', badgeClass: 'bg-sky-100 text-sky-800' },
    { score: 3, shortLabel: '3 • TC', fullEn: 'Achieved', fullId: 'Tercapai Sesuai Harapan (TC)', activeClass: 'bg-emerald-600 text-white shadow-xs', badgeClass: 'bg-emerald-100 text-emerald-800' },
    { score: 4, shortLabel: '4 • M', fullEn: 'Mastered', fullId: 'Mahir / Sangat Berkembang (M)', activeClass: 'bg-purple-600 text-white shadow-xs', badgeClass: 'bg-purple-100 text-purple-800' },
  ];

  // Competency Statistics for current student
  const studentEvals = currentStudent 
    ? studentEvaluations.filter((e) => e.studentId === currentStudent.id)
    : [];
  const countMastered = studentEvals.filter((e) => e.competencyScore === 4).length;
  const countAchieved = studentEvals.filter((e) => e.competencyScore === 3).length;
  const countDeveloping = studentEvals.filter((e) => e.competencyScore === 2).length;
  const countEmerging = studentEvals.filter((e) => e.competencyScore === 1).length;

  const handleScoreChange = (milestoneId: string, score: CompetencyScore) => {
    if (!currentStudent) return;
    const existing = studentEvals.find((e) => e.milestoneId === milestoneId);
    setStudentMilestoneScore(currentStudent.id, milestoneId, score, existing?.teacherNotes);
    const lvl = competencyLevels.find((l) => l.score === score);
    addToast(
      language === 'id' 
        ? `${currentStudent.nickname}: ${lvl?.fullId}`
        : `${currentStudent.nickname}: ${lvl?.fullEn}`,
      'success'
    );
  };

  const handleOpenNote = (milestoneId: string) => {
    const existing = studentEvals.find((e) => e.milestoneId === milestoneId);
    setEditingNoteMilestoneId(milestoneId);
    setNoteInput(existing?.teacherNotes || '');
  };

  const handleSaveNote = () => {
    if (!currentStudent || !editingNoteMilestoneId) return;
    const existing = studentEvals.find((e) => e.milestoneId === editingNoteMilestoneId);
    const score = existing?.competencyScore || 3; // default to 3 if not yet rated
    setStudentMilestoneScore(currentStudent.id, editingNoteMilestoneId, score, noteInput.trim());
    setEditingNoteMilestoneId(null);
    setNoteInput('');
    addToast(language === 'id' ? 'Catatan capaian berhasil disimpan' : 'Evaluation note saved', 'success');
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      
      {/* Top Header & Student Selector */}
      <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-extrabold text-stone-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-teal-700" />
            CEFR {activeCohort?.cefrLevel} Milestone Gradebook
          </h3>
          <p className="text-xs text-stone-500 font-medium mt-0.5">
            {language === 'id'
              ? 'Penilaian formatif 4-tingkat berbasis deskriptor CEFR resmi.'
              : '4-level formative competency assessment based on canonical CEFR descriptors.'}
          </p>
        </div>

        {/* Student Selector Dropdown */}
        <div className="flex items-center gap-2 bg-stone-50 p-1.5 rounded-2xl border border-stone-200">
          <span className="text-xs font-bold text-stone-600 pl-2">
            {language === 'id' ? 'Evaluasi Siswa:' : 'Evaluating Student:'}
          </span>
          <select
            value={currentStudent?.id || ''}
            onChange={(e) => {
              const st = cohortStudents.find((s) => s.id === e.target.value);
              if (st) onSelectStudent(st);
            }}
            className="px-3 py-1.5 text-xs bg-white border border-stone-200 rounded-xl font-bold text-stone-800 focus:ring-2 focus:ring-teal-700 cursor-pointer"
          >
            {cohortStudents.map((st) => (
              <option key={st.id} value={st.id}>
                {st.fullName} ({st.nickname})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Student Competency Pulse Radar / KPI Strip */}
      {currentStudent && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">
                {language === 'id' ? 'Mahir (M)' : 'Mastered (M)'}
              </span>
              <span className="text-2xl font-black text-stone-900 mt-0.5 block">{countMastered}</span>
            </div>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
              <Star className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                {language === 'id' ? 'Tercapai (TC)' : 'Achieved (TC)'}
              </span>
              <span className="text-2xl font-black text-stone-900 mt-0.5 block">{countAchieved}</span>
            </div>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-sky-700 uppercase tracking-wider block">
                {language === 'id' ? 'Berkembang (SB)' : 'Developing (SB)'}
              </span>
              <span className="text-2xl font-black text-stone-900 mt-0.5 block">{countDeveloping}</span>
            </div>
            <div className="p-2 rounded-xl bg-sky-50 text-sky-700 border border-sky-200">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
                {language === 'id' ? 'Mulai (MB)' : 'Emerging (MB)'}
              </span>
              <span className="text-2xl font-black text-stone-900 mt-0.5 block">{countEmerging}</span>
            </div>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs (Skills & Level) */}
      <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-xs space-y-4">
        {/* Skills */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-stone-500">
            <Filter className="w-3.5 h-3.5 text-teal-700" />
            <span>{language === 'id' ? 'Filter Keterampilan Bahasa:' : 'Filter Language Skills:'}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {SKILLS.map((sk) => {
              const isSelected = selectedSkill === sk.key;
              return (
                <button
                  key={sk.key}
                  onClick={() => setSelectedSkill(sk.key)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-teal-800 text-white shadow-xs'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {language === 'id' ? sk.labelId : sk.labelEn}
                </button>
              );
            })}
          </div>
        </div>

        {/* Level filter */}
        <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Level:</span>
          {(['all', 'Pre-A1', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as (CEFRLevel | 'all')[]).map((lvl) => {
            const isSelected = selectedLevel === lvl;
            return (
              <button
                key={lvl}
                onClick={() => setSelectedLevel(lvl)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-teal-800 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {lvl === 'all' ? (language === 'id' ? 'Semua Level' : 'All Levels') : lvl}
              </button>
            );
          })}
        </div>
      </div>

      {/* Descriptors Evaluation List */}
      <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <h4 className="text-xs font-extrabold text-stone-900 uppercase tracking-wider">
            {language === 'id' ? 'Daftar Indikator Kemahiran CEFR' : 'CEFR Competency Descriptors'} ({filteredMilestones.length})
          </h4>
          <span className="text-xs text-stone-400 font-medium">
            {language === 'id' ? 'Klik tingkat capaian untuk menilai' : 'Click rating level to score'}
          </span>
        </div>

        <div className="divide-y divide-stone-100">
          {filteredMilestones.length === 0 ? (
            <div className="p-8 text-center text-stone-400 text-xs">
              <p>{language === 'id' ? 'Tidak ada deskriptor yang cocok dengan filter.' : 'No descriptors found for this filter.'}</p>
            </div>
          ) : (
            filteredMilestones.map((ms) => {
              const studentEval = currentStudent
                ? studentEvals.find((e) => e.milestoneId === ms.id)
                : undefined;
              const currentScore = studentEval?.competencyScore;

              return (
                <div key={ms.id} className="py-4.5 space-y-2.5">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    
                    {/* Descriptor Information */}
                    <div className="max-w-2xl space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-stone-100 text-stone-800 border border-stone-200">
                          {ms.code}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-100">
                          CEFR {ms.cefrLevel}
                        </span>
                        <span className="text-xs font-bold text-teal-800 uppercase tracking-wider">
                          {ms.skillCategory.replace('_', ' ')}
                        </span>
                      </div>

                      <h5 className="text-sm font-bold text-stone-900 leading-snug">
                        {language === 'id' ? ms.descriptionId : ms.descriptionEn}
                      </h5>

                      <p className="text-xs text-stone-600 italic bg-stone-50 p-2.5 rounded-xl border border-stone-200/70">
                        "{language === 'id' ? ms.canDoStatementId : ms.canDoStatementEn}"
                      </p>
                    </div>

                    {/* 4-Point Rating Buttons & Note Button */}
                    <div className="flex items-center gap-1.5 shrink-0 self-start">
                      {competencyLevels.map((lvl) => {
                        const isActive = currentScore === lvl.score;
                        return (
                          <button
                            key={lvl.score}
                            onClick={() => handleScoreChange(ms.id, lvl.score)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              isActive ? lvl.activeClass : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                            }`}
                            title={language === 'id' ? lvl.fullId : lvl.fullEn}
                          >
                            {lvl.shortLabel}
                          </button>
                        );
                      })}

                      <button
                        onClick={() => handleOpenNote(ms.id)}
                        className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                          studentEval?.teacherNotes
                            ? 'bg-teal-50 text-teal-800 border-teal-200'
                            : 'bg-stone-100 hover:bg-stone-200 text-stone-500 border-stone-200'
                        }`}
                        title={studentEval?.teacherNotes ? `Catatan: ${studentEval.teacherNotes}` : 'Tambah catatan kualitatif'}
                      >
                        <FileEdit className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>

                  {/* Teacher Observation Note Display */}
                  {studentEval?.teacherNotes && (
                    <div className="flex items-center gap-2 text-xs font-medium text-teal-900 bg-teal-50/80 px-3 py-1.5 rounded-xl border border-teal-200">
                      <MessageSquare className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                      <span>{studentEval.teacherNotes}</span>
                    </div>
                  )}

                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Milestone Qualitative Note Modal */}
      {editingNoteMilestoneId && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-stone-200 p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-extrabold text-stone-900 flex items-center gap-2">
                <FileEdit className="w-4 h-4 text-teal-700" />
                {language === 'id' ? 'Catatan Capaian Siswa' : 'Teacher Observation Note'}
              </h4>
              <button
                onClick={() => setEditingNoteMilestoneId(null)}
                className="text-stone-400 hover:text-stone-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-stone-500">
              {language === 'id'
                ? `Tulis catatan kualitatif untuk ${currentStudent?.fullName}:`
                : `Add qualitative feedback for ${currentStudent?.fullName}:`}
            </p>

            <textarea
              rows={3}
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              placeholder="e.g. Shows high fluency during pair discussion, needs encouragement in spontaneous Q&A..."
              className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-teal-700 text-stone-800"
              autoFocus
            />

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setEditingNoteMilestoneId(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 bg-stone-100 hover:bg-stone-200 cursor-pointer"
              >
                {language === 'id' ? 'Batal' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleSaveNote}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-teal-800 hover:bg-teal-900 shadow-xs cursor-pointer"
              >
                {language === 'id' ? 'Simpan Catatan' : 'Save Note'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
