import React, { useState } from 'react';
import { 
  Users, Award, Search, 
  MessageSquare, ChevronRight
} from 'lucide-react';
import { useTeacherStore } from '../../store/useTeacherStore';
import { useTranslation } from '../../utils/i18n';
import { Student } from '../../types';

export const ClassesStudentsHub: React.FC = () => {
  const { 
    cohorts, selectedCohortId, setSelectedCohortId,
    students, cefrMilestones, language 
  } = useTeacherStore();
  const t = useTranslation(language);

  const [activeSubTab, setActiveSubTab] = useState<'roster' | 'cefr' | 'attendance'>('roster');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const activeCohort = cohorts.find((c) => c.id === selectedCohortId) || cohorts[0];
  const cohortStudents = students.filter((s) => s.cohortId === activeCohort?.id);

  const filteredStudents = cohortStudents.filter((s) =>
    s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.nickname.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-150">
      
      {/* Top Header & Cohort Picker Bar */}
      <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-stone-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-700" />
            {t.hubs.classesTab}
          </h2>
          <p className="text-xs text-stone-500 font-medium mt-0.5">
            {language === 'id' 
              ? 'Kelola daftar rombel, data siswa, dan capaian indikator CEFR.' 
              : 'Manage cohort rosters, student directories, and CEFR milestone gradebooks.'}
          </p>
        </div>

        {/* Cohort Chips Selector */}
        <div className="flex items-center gap-2 flex-wrap">
          {cohorts.map((cohort) => (
            <button
              key={cohort.id}
              onClick={() => {
                setSelectedCohortId(cohort.id);
                setSelectedStudent(null);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedCohortId === cohort.id
                  ? 'bg-teal-800 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              {cohort.name} ({cohort.cefrLevel})
            </button>
          ))}
        </div>
      </div>

      {/* Sub-Tabs (Student Directory | CEFR Gradebook | Attendance Log) */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
        <button
          onClick={() => setActiveSubTab('roster')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'roster'
              ? 'bg-white text-teal-900 shadow-xs border border-stone-200'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          {t.hubs.studentsTab} ({cohortStudents.length})
        </button>
        <button
          onClick={() => setActiveSubTab('cefr')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'cefr'
              ? 'bg-white text-teal-900 shadow-xs border border-stone-200'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          {t.hubs.cefrTab}
        </button>
      </div>

      {/* Tab 1: Student Directory (Master-Detail View) */}
      {activeSubTab === 'roster' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Student List (5 Cols) */}
          <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-stone-200 shadow-xs space-y-4">
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === 'id' ? 'Cari nama siswa...' : 'Search student...'}
                className="w-full pl-9 pr-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-teal-700 focus:bg-white text-stone-800"
              />
            </div>

            <div className="divide-y divide-stone-100 max-h-[460px] overflow-y-auto pr-1">
              {filteredStudents.map((st) => {
                const isSelected = (selectedStudent?.id || filteredStudents[0]?.id) === st.id;
                return (
                  <div
                    key={st.id}
                    onClick={() => setSelectedStudent(st)}
                    className={`p-3 rounded-xl cursor-pointer transition-all flex items-center justify-between ${
                      isSelected ? 'bg-teal-50/80 border border-teal-200' : 'hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-stone-100 text-stone-800 font-bold text-xs flex items-center justify-center border border-stone-200">
                        {st?.nickname?.[0] || st?.fullName?.[0] || 'S'}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-stone-900">{st.fullName}</p>
                        <p className="text-[11px] text-stone-400">Guardian: {st.guardianName}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-stone-400" />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Student Profile Details (7 Cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-stone-200 shadow-xs">
            {(() => {
              const currentSt = selectedStudent || filteredStudents[0];
              if (!currentSt) return <p className="text-stone-400 text-xs">Select a student.</p>;

              return (
                <div className="space-y-5">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-teal-800 text-white font-extrabold text-base flex items-center justify-center shadow-xs">
                        {currentSt?.nickname?.[0] || currentSt?.fullName?.[0] || 'S'}
                      </div>
                      <div>
                        <h3 className="text-lg font-extrabold text-stone-900">{currentSt.fullName}</h3>
                        <p className="text-xs text-stone-500 font-medium">Nickname: "{currentSt.nickname}" • Cohort: {activeCohort?.name}</p>
                      </div>
                    </div>

                    <a
                      href={`https://wa.me/${currentSt.guardianPhone?.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold flex items-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                      <span>WhatsApp Guardian</span>
                    </a>
                  </div>

                  {/* Academic Strengths & Growth Areas */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block mb-1">
                        {language === 'id' ? 'Kelebihan / Kekuatan' : 'Strengths'}
                      </span>
                      <p className="text-xs text-stone-700 leading-relaxed">{currentSt.strengths || 'Consistent participant'}</p>
                    </div>

                    <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100">
                      <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block mb-1">
                        {language === 'id' ? 'Area Pengembangan' : 'Growth Areas'}
                      </span>
                      <p className="text-xs text-stone-700 leading-relaxed">{currentSt.growthAreas || 'Focus on spelling accuracy'}</p>
                    </div>
                  </div>

                  {/* General Teacher Notes */}
                  <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
                    <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
                      {language === 'id' ? 'Catatan Umum Guru' : 'Teacher Observation Log'}
                    </span>
                    <p className="text-xs text-stone-700 leading-relaxed">{currentSt.notes}</p>
                  </div>
                </div>
              );
            })()}
          </div>

        </div>
      )}

      {/* Tab 2: CEFR Milestone Gradebook */}
      {activeSubTab === 'cefr' && (
        <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-stone-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-teal-700" />
              CEFR {activeCohort?.cefrLevel} Descriptors & Milestone Evaluations
            </h3>
            <span className="text-xs text-stone-500 font-medium">4-Point Qualitative Scale</span>
          </div>

          <div className="divide-y divide-stone-100">
            {cefrMilestones.map((ms) => (
              <div key={ms.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="max-w-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-100 text-stone-800 border border-stone-200">
                      {ms.code}
                    </span>
                    <span className="text-xs font-bold text-teal-800 uppercase tracking-wider">
                      {ms.skillCategory.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-stone-800">
                    {language === 'id' ? ms.canDoStatementId : ms.canDoStatementEn}
                  </p>
                </div>

                {/* 4-point rating buttons */}
                <div className="flex items-center gap-1.5">
                  <button className="px-2.5 py-1 rounded-lg text-xs font-bold bg-stone-100 hover:bg-stone-200 text-stone-700">
                    1 • MB
                  </button>
                  <button className="px-2.5 py-1 rounded-lg text-xs font-bold bg-stone-100 hover:bg-stone-200 text-stone-700">
                    2 • SB
                  </button>
                  <button className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 text-white shadow-xs">
                    3 • TC (Achieved)
                  </button>
                  <button className="px-2.5 py-1 rounded-lg text-xs font-bold bg-stone-100 hover:bg-stone-200 text-stone-700">
                    4 • M
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
