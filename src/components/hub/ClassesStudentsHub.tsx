import React, { useState } from 'react';
import { 
  Users, Search, Plus, Edit2, Trash2,
  MessageSquare, ChevronRight, MapPin, Clock, 
  ArrowRightLeft, Sparkles, TrendingUp, Phone, Mail, FileText,
  CalendarCheck2, Star
} from 'lucide-react';
import { useTeacherStore } from '../../store/useTeacherStore';
import { useTranslation } from '../../utils/i18n';
import { toWhatsAppNumber } from '../../utils/phone';
import { Student, Cohort } from '../../types';
import { CohortModal } from './CohortModal';
import { StudentModal } from './StudentModal';
import { AttendanceHistoryTab } from './AttendanceHistoryTab';
import { CefrGradebookTab } from './CefrGradebookTab';
import { ConfirmModal } from '../common/ConfirmModal';
import { useEscapeKey } from '../../hooks/useEscapeKey';

export const ClassesStudentsHub: React.FC = () => {
  const { 
    cohorts, selectedCohortId, setSelectedCohortId, deleteCohort,
    students, deleteStudent, transferStudent, attendanceRecords,
    studentEvaluations, language, teacher, addToast
  } = useTeacherStore();
  const t = useTranslation(language);

  const [activeSubTab, setActiveSubTab] = useState<'roster' | 'attendance' | 'cefr'>('roster');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // Modals state
  const [isCohortModalOpen, setCohortModalOpen] = useState(false);
  const [cohortToEdit, setCohortToEdit] = useState<Cohort | null>(null);

  const [isStudentModalOpen, setStudentModalOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);

  const [confirmDeleteCohort, setConfirmDeleteCohort] = useState<Cohort | null>(null);
  const [confirmDeleteStudent, setConfirmDeleteStudent] = useState<Student | null>(null);
  const [transferModalStudent, setTransferModalStudent] = useState<Student | null>(null);
  const [targetCohortId, setTargetCohortId] = useState<string>('');

  const activeCohort = cohorts.find((c) => c.id === selectedCohortId) || cohorts[0];
  const cohortStudents = students.filter((s) => s.cohortId === activeCohort?.id);

  const filteredStudents = cohortStudents.filter((s) =>
    s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.nickname.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentStudent = students.find((s) => s.id === (selectedStudentId || filteredStudents[0]?.id)) || filteredStudents[0];

  // Calculate attendance stats for current student
  const studentAttendanceRecords = currentStudent
    ? attendanceRecords.filter((r) => r.studentId === currentStudent.id)
    : [];
  const studentPresentCount = studentAttendanceRecords.filter((r) => r.status === 'present').length;
  const studentAbsentCount = studentAttendanceRecords.filter((r) => r.status === 'absent').length;
  const studentLateCount = studentAttendanceRecords.filter((r) => r.status === 'late').length;
  const studentAttendanceRate = studentAttendanceRecords.length > 0
    ? Math.round(((studentPresentCount + studentLateCount) / studentAttendanceRecords.length) * 100)
    : 100;

  // Calculate CEFR evaluations for current student
  const studentEvals = currentStudent
    ? studentEvaluations.filter((e) => e.studentId === currentStudent.id)
    : [];
  const countMastered = studentEvals.filter((e) => e.competencyScore === 4).length;
  const countAchieved = studentEvals.filter((e) => e.competencyScore === 3).length;

  // Numbers shown in the delete confirmations (what exactly will be removed)
  const cohortDeleteCount = confirmDeleteCohort ? students.filter((s) => s.cohortId === confirmDeleteCohort.id).length : 0;
  const studentDeleteAttendance = confirmDeleteStudent ? attendanceRecords.filter((r) => r.studentId === confirmDeleteStudent.id).length : 0;
  const studentDeleteEvals = confirmDeleteStudent ? studentEvaluations.filter((e) => e.studentId === confirmDeleteStudent.id).length : 0;

  useEscapeKey(() => setTransferModalStudent(null), !!transferModalStudent);

  const handleOpenAddCohort = () => {
    setCohortToEdit(null);
    setCohortModalOpen(true);
  };

  const handleOpenEditCohort = () => {
    if (!activeCohort) return;
    setCohortToEdit(activeCohort);
    setCohortModalOpen(true);
  };

  const handleOpenAddStudent = () => {
    setStudentToEdit(null);
    setStudentModalOpen(true);
  };

  const handleOpenEditStudent = (st: Student) => {
    setStudentToEdit(st);
    setStudentModalOpen(true);
  };

  const handleDeleteCohortConfirm = () => {
    if (!confirmDeleteCohort) return;
    deleteCohort(confirmDeleteCohort.id);
    addToast(language === 'id' ? 'Kelas berhasil dihapus' : 'Cohort deleted successfully', 'info');
    setConfirmDeleteCohort(null);
  };

  const handleDeleteStudentConfirm = () => {
    if (!confirmDeleteStudent) return;
    deleteStudent(confirmDeleteStudent.id);
    addToast(language === 'id' ? 'Siswa berhasil dihapus' : 'Student removed from roster', 'info');
    setConfirmDeleteStudent(null);
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferModalStudent || !targetCohortId) return;
    transferStudent(transferModalStudent.id, targetCohortId);
    const targetCohort = cohorts.find((c) => c.id === targetCohortId);
    addToast(
      language === 'id' 
        ? `${transferModalStudent.fullName} dipindahkan ke ${targetCohort?.name || 'kelas baru'}`
        : `${transferModalStudent.fullName} transferred to ${targetCohort?.name || 'new cohort'}`,
      'success'
    );
    setTransferModalStudent(null);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-150">
      
      {/* Top Header & Cohort Picker Bar */}
      <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-stone-900 tracking-tight flex items-center gap-2">
              <Users className="w-5 h-5 text-teal-700" />
              {t.hubs.classesTab}
            </h2>
            <p className="text-xs text-stone-500 font-medium mt-0.5">
              {language === 'id' 
                ? 'Kelola rombel kelas, direktori siswa, presensi harian, dan capaian CEFR.' 
                : 'Manage cohort rosters, student directories, attendance logs, and CEFR milestones.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenAddCohort}
              className="px-4 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{language === 'id' ? 'Tambah Rombel' : 'Add Cohort'}</span>
            </button>
          </div>
        </div>

        {/* Cohort Chips Selector & Management Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-100">
          <div className="flex items-center gap-2 flex-wrap">
            {cohorts.map((cohort) => {
              const isSelected = activeCohort?.id === cohort.id;
              const count = students.filter((s) => s.cohortId === cohort.id).length;
              return (
                <button
                  key={cohort.id}
                  onClick={() => {
                    setSelectedCohortId(cohort.id);
                    setSelectedStudentId(null);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-teal-800 text-white shadow-xs'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  <span>{cohort.name}</span>
                  <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${
                    isSelected ? 'bg-teal-900 text-teal-200' : 'bg-stone-200 text-stone-600'
                  }`}>
                    {cohort.cefrLevel} • {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Cohort Action Buttons */}
          {activeCohort && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleOpenEditCohort}
                className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Edit active cohort details"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>{language === 'id' ? 'Edit Kelas' : 'Edit Cohort'}</span>
              </button>

              <button
                onClick={() => setConfirmDeleteCohort(activeCohort)}
                className="p-2 rounded-xl bg-stone-100 hover:bg-rose-50 text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
                title="Delete cohort"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Active Cohort Metadata Strip */}
        {activeCohort && (
          <div className="bg-stone-50 rounded-2xl p-3.5 border border-stone-200/80 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-600">
            <div className="flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1 font-semibold text-stone-800">
                <Clock className="w-3.5 h-3.5 text-teal-700" />
                {activeCohort.scheduleDays?.join(', ') || '—'} • {activeCohort.startTime || '—'} ({activeCohort.durationMinutes || 60}m)
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-stone-400" />
                {activeCohort.roomOrLink || '—'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="font-semibold text-stone-700">
                {language === 'id' ? 'Tarif Honor:' : 'Hourly Rate:'}{' '}
                <span className="font-bold text-teal-900">
                  {new Intl.NumberFormat(language === 'id' ? 'id-ID' : 'en-US', {
                    style: 'currency',
                    currency: teacher.currency || 'IDR',
                    maximumFractionDigits: 0,
                  }).format(activeCohort.hourlyRateOverride || teacher.defaultHourlyRate)}/hr
                </span>
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                {cohortStudents.length} {language === 'id' ? 'Siswa Terdaftar' : 'Enrolled'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Sub-Tabs (Student Directory | Attendance Log | CEFR Gradebook) */}
      <div className="flex items-center justify-between border-b border-stone-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('roster')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'roster'
                ? 'bg-white text-teal-900 shadow-xs border border-stone-200'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            {t.hubs.studentsTab} ({cohortStudents.length})
          </button>
          <button
            onClick={() => setActiveSubTab('attendance')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'attendance'
                ? 'bg-white text-teal-900 shadow-xs border border-stone-200'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            {t.hubs.attendanceTab}
          </button>
          <button
            onClick={() => setActiveSubTab('cefr')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'cefr'
                ? 'bg-white text-teal-900 shadow-xs border border-stone-200'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            {t.hubs.cefrTab}
          </button>
        </div>

        {activeSubTab === 'roster' && (
          <button
            onClick={handleOpenAddStudent}
            className="px-3.5 py-1.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{language === 'id' ? 'Tambah Siswa' : 'Add Student'}</span>
          </button>
        )}
      </div>

      {/* Sub-Tab 1: Student Directory (Master-Detail View) */}
      {activeSubTab === 'roster' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Student List (5 Cols) */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-5 border border-stone-200 shadow-xs space-y-4">
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === 'id' ? 'Cari nama siswa atau panggilan...' : 'Search student by name...'}
                className="w-full pl-9 pr-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-teal-700 focus:bg-white text-stone-800 placeholder-stone-400"
              />
            </div>

            <div className="divide-y divide-stone-100 max-h-[500px] overflow-y-auto pr-1">
              {filteredStudents.length === 0 ? (
                <div className="p-8 text-center text-stone-400 text-xs">
                  <p>{language === 'id' ? 'Belum ada siswa di kelas ini.' : 'No students found in this cohort.'}</p>
                  <button
                    onClick={handleOpenAddStudent}
                    className="mt-3 px-3 py-1.5 rounded-xl bg-teal-50 text-teal-800 text-xs font-bold border border-teal-200 hover:bg-teal-100 transition-colors"
                  >
                    + {language === 'id' ? 'Tambah Siswa Pertama' : 'Add First Student'}
                  </button>
                </div>
              ) : (
                filteredStudents.map((st) => {
                  const isSelected = (currentStudent?.id) === st.id;
                  return (
                    <div
                      key={st.id}
                      onClick={() => setSelectedStudentId(st.id)}
                      className={`p-3 rounded-2xl cursor-pointer transition-all flex items-center justify-between ${
                        isSelected ? 'bg-teal-50/90 border border-teal-200 shadow-2xs' : 'hover:bg-stone-50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-stone-100 text-stone-800 font-bold text-xs flex items-center justify-center border border-stone-200 shrink-0">
                          {st.nickname?.[0] || st.fullName?.[0] || 'S'}
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-bold text-stone-900 truncate">{st.fullName}</p>
                          <p className="text-[11px] text-stone-400 truncate">
                            {st.nickname ? `(${st.nickname}) • ` : ''}Wali: {st.guardianName || '-'}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 shrink-0 ${isSelected ? 'text-teal-700' : 'text-stone-300'}`} />
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Student Profile Details (7 Cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 border border-stone-200 shadow-xs">
            {!currentStudent ? (
              <div className="h-full flex items-center justify-center p-12 text-center text-stone-400 text-xs">
                <p>{language === 'id' ? 'Pilih siswa dari daftar sebelah kiri.' : 'Select a student from the list.'}</p>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Profile Header & Quick Actions */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-100 pb-5">
                  <div className="flex items-center gap-3.5">
                    <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-teal-800 to-teal-700 text-white font-extrabold text-lg flex items-center justify-center shadow-xs">
                      {currentStudent.nickname?.[0] || currentStudent.fullName?.[0] || 'S'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-black text-stone-900">{currentStudent.fullName}</h3>
                        {currentStudent.gender && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-100 text-stone-600 border border-stone-200">
                            {currentStudent.gender === 'M' ? 'L' : currentStudent.gender === 'F' ? 'P' : currentStudent.gender}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-500 font-medium mt-0.5">
                        Nickname: <span className="text-stone-800 font-bold">"{currentStudent.nickname}"</span> • {activeCohort?.name}
                      </p>
                    </div>
                  </div>

                  {/* WhatsApp & Manage Student Buttons */}
                  <div className="flex items-center gap-2">
                    {currentStudent.guardianPhone && (
                      <a
                        href={`https://wa.me/${toWhatsAppNumber(currentStudent.guardianPhone)}?text=${encodeURIComponent(
                          language === 'id'
                            ? `Halo Bapak/Ibu ${currentStudent.guardianName}, saya ${teacher.name} guru pengampu ${currentStudent.fullName}.`
                            : `Hello Mr/Mrs ${currentStudent.guardianName}, this is ${teacher.name}, teacher of ${currentStudent.fullName}.`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                        <span>WhatsApp</span>
                      </a>
                    )}

                    <button
                      onClick={() => handleOpenEditStudent(currentStudent)}
                      className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
                      title="Edit student profile"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        setTransferModalStudent(currentStudent);
                        setTargetCohortId(cohorts.find((c) => c.id !== currentStudent.cohortId)?.id || '');
                      }}
                      className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
                      title="Transfer student to another cohort"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setConfirmDeleteStudent(currentStudent)}
                      className="p-2 rounded-xl bg-stone-100 hover:bg-rose-50 text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Delete student"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Individual Student KPI Twin Gauges (Attendance & CEFR) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
                  {/* Attendance Gauge */}
                  <div className="bg-stone-900 text-white rounded-2xl p-4 shadow-xs flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-stone-800 border border-stone-700 flex items-center justify-center font-black text-sm text-emerald-400">
                        {studentAttendanceRate}%
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                          {language === 'id' ? 'Kehadiran Siswa' : 'Attendance Rate'}
                        </span>
                        <p className="text-xs text-stone-200 font-medium mt-0.5">
                          {studentPresentCount} Hadir • {studentAbsentCount} Alpa
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveSubTab('attendance')}
                      className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors cursor-pointer"
                      title="Open Attendance"
                    >
                      <CalendarCheck2 className="w-4 h-4 text-emerald-400" />
                    </button>
                  </div>

                  {/* CEFR Competency Gauge */}
                  <div className="bg-teal-900 text-white rounded-2xl p-4 shadow-xs flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-950/70 border border-teal-700/50 flex items-center justify-center font-black text-sm text-amber-300">
                        {countMastered + countAchieved}
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-teal-200 uppercase tracking-wider block">
                          {language === 'id' ? 'Capaian CEFR' : 'CEFR Achieved'}
                        </span>
                        <p className="text-xs text-teal-100 font-medium mt-0.5">
                          {countMastered} Mahir • {countAchieved} Tercapai
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveSubTab('cefr')}
                      className="p-2 rounded-xl bg-teal-800 hover:bg-teal-700 text-teal-200 transition-colors cursor-pointer"
                      title="Open CEFR Gradebook"
                    >
                      <Star className="w-4 h-4 text-amber-300" />
                    </button>
                  </div>

                </div>

                {/* Guardian & Contact Card */}
                <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200/80 space-y-2">
                  <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                    {language === 'id' ? 'Informasi Wali Murid' : 'Guardian Details'}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-stone-400 block text-[11px]">Nama Wali</span>
                      <span className="font-bold text-stone-800">{currentStudent.guardianName || '-'}</span>
                    </div>
                    <div>
                      <span className="text-stone-400 block text-[11px] flex items-center gap-1">
                        <Phone className="w-3 h-3 text-teal-700" /> WhatsApp
                      </span>
                      <span className="font-bold text-stone-800 font-mono">{currentStudent.guardianPhone || '-'}</span>
                    </div>
                    {currentStudent.guardianEmail && (
                      <div className="sm:col-span-2">
                        <span className="text-stone-400 block text-[11px] flex items-center gap-1">
                          <Mail className="w-3 h-3 text-stone-400" /> Email
                        </span>
                        <span className="font-medium text-stone-700">{currentStudent.guardianEmail}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Academic Strengths & Growth Areas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 space-y-1">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      {language === 'id' ? 'Kelebihan / Kekuatan' : 'Strengths'}
                    </span>
                    <p className="text-xs text-stone-700 leading-relaxed font-medium">
                      {currentStudent.strengths || (language === 'id' ? 'Aktif dan konsisten dalam sesi.' : 'Consistent participant.')}
                    </p>
                  </div>

                  <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100 space-y-1">
                    <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
                      {language === 'id' ? 'Area Pengembangan' : 'Growth Areas'}
                    </span>
                    <p className="text-xs text-stone-700 leading-relaxed font-medium">
                      {currentStudent.growthAreas || (language === 'id' ? 'Fokus pada ejaan dan tata bahasa.' : 'Focus on vocabulary practice.')}
                    </p>
                  </div>
                </div>

                {/* General Teacher Notes */}
                {currentStudent.notes && (
                  <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-1">
                    <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-stone-400" />
                      {language === 'id' ? 'Catatan Observasi Guru' : 'Teacher Observation Log'}
                    </span>
                    <p className="text-xs text-stone-700 leading-relaxed">{currentStudent.notes}</p>
                  </div>
                )}

              </div>
            )}
          </div>

        </div>
      )}

      {/* Sub-Tab 2: Dedicated Attendance Engine & Historic Log */}
      {activeSubTab === 'attendance' && activeCohort && (
        <AttendanceHistoryTab
          activeCohort={activeCohort}
          cohortStudents={cohortStudents}
        />
      )}

      {/* Sub-Tab 3: CEFR Milestone Gradebook */}
      {activeSubTab === 'cefr' && activeCohort && (
        <CefrGradebookTab
          activeCohort={activeCohort}
          cohortStudents={cohortStudents}
          selectedStudent={currentStudent}
          onSelectStudent={(st) => setSelectedStudentId(st.id)}
        />
      )}

      {/* Cohort Modal (Add / Edit) */}
      <CohortModal
        isOpen={isCohortModalOpen}
        cohortToEdit={cohortToEdit}
        onClose={() => {
          setCohortModalOpen(false);
          setCohortToEdit(null);
        }}
      />

      {/* Student Modal (Add / Edit) */}
      <StudentModal
        isOpen={isStudentModalOpen}
        studentToEdit={studentToEdit}
        defaultCohortId={activeCohort?.id || cohorts[0]?.id || ''}
        onClose={() => {
          setStudentModalOpen(false);
          setStudentToEdit(null);
        }}
      />

      {/* Delete Cohort Confirmation Modal */}
      <ConfirmModal
        isOpen={!!confirmDeleteCohort}
        title={language === 'id' ? 'Hapus Kelas / Rombel?' : 'Delete Cohort?'}
        message={
          language === 'id'
            ? `Hapus rombel "${confirmDeleteCohort?.name}"? ${cohortDeleteCount} siswa beserta riwayat presensi, capaian CEFR, dan laporan wali mereka akan dihapus permanen. Rencana ajar dan tugas terkait tetap disimpan (tanpa rombel); riwayat sesi mengajar & klaim honor tidak diubah.`
            : `Delete "${confirmDeleteCohort?.name}"? Its ${cohortDeleteCount} student(s) and their attendance, CEFR evaluations and parent reports will be permanently deleted. Related lesson plans and tasks are kept (unlinked); Teaching Session and claim history is not changed.`
        }
        confirmText={language === 'id' ? 'Ya, Hapus Kelas' : 'Yes, Delete Cohort'}
        cancelText={language === 'id' ? 'Batal' : 'Cancel'}
        isDangerous={true}
        onConfirm={handleDeleteCohortConfirm}
        onCancel={() => setConfirmDeleteCohort(null)}
      />

      {/* Delete Student Confirmation Modal */}
      <ConfirmModal
        isOpen={!!confirmDeleteStudent}
        title={language === 'id' ? 'Hapus Siswa dari Roster?' : 'Remove Student?'}
        message={
          language === 'id'
            ? `Hapus siswa "${confirmDeleteStudent?.fullName}"? ${studentDeleteAttendance} catatan presensi, ${studentDeleteEvals} evaluasi CEFR, dan laporan wali siswa ini akan dihapus permanen.`
            : `Remove "${confirmDeleteStudent?.fullName}"? ${studentDeleteAttendance} attendance record(s), ${studentDeleteEvals} CEFR evaluation(s) and this student's parent reports will be permanently deleted.`
        }
        confirmText={language === 'id' ? 'Ya, Hapus Siswa' : 'Yes, Remove Student'}
        cancelText={language === 'id' ? 'Batal' : 'Cancel'}
        isDangerous={true}
        onConfirm={handleDeleteStudentConfirm}
        onCancel={() => setConfirmDeleteStudent(null)}
      />

      {/* Transfer Student Modal */}
      {transferModalStudent && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-stone-200 p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <h3 className="text-base font-extrabold text-stone-900 flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-teal-700" />
              {language === 'id' ? 'Pindahkan Siswa ke Rombel Lain' : 'Transfer Student to Cohort'}
            </h3>
            <p className="text-xs text-stone-600">
              {language === 'id'
                ? `Pilih kelas tujuan untuk memindahkan ${transferModalStudent.fullName}:`
                : `Select the destination cohort for ${transferModalStudent.fullName}:`}
            </p>

            <form onSubmit={handleTransferSubmit} className="space-y-4">
              <select
                value={targetCohortId}
                onChange={(e) => setTargetCohortId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl font-bold text-stone-800 focus:ring-2 focus:ring-teal-700"
              >
                {cohorts.map((c) => (
                  <option key={c.id} value={c.id} disabled={c.id === transferModalStudent.cohortId}>
                    {c.name} ({c.cefrLevel}) {c.id === transferModalStudent.cohortId ? '(Kelas Saat Ini)' : ''}
                  </option>
                ))}
              </select>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setTransferModalStudent(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 bg-stone-100 hover:bg-stone-200 transition-colors cursor-pointer"
                >
                  {language === 'id' ? 'Batal' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-teal-800 hover:bg-teal-900 transition-all shadow-xs cursor-pointer"
                >
                  {language === 'id' ? 'Pindahkan Siswa' : 'Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
