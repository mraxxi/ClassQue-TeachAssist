import React, { useState, useEffect } from 'react';
import { X, User, Phone, Mail, Sparkles, TrendingUp, FileText } from 'lucide-react';
import { Student } from '../../types';
import { useTeacherStore } from '../../store/useTeacherStore';
import { useEscapeKey } from '../../hooks/useEscapeKey';

interface StudentModalProps {
  isOpen: boolean;
  studentToEdit?: Student | null;
  defaultCohortId: string;
  onClose: () => void;
}

export const StudentModal: React.FC<StudentModalProps> = ({
  isOpen,
  studentToEdit,
  defaultCohortId,
  onClose,
}) => {
  const { cohorts, addStudent, updateStudent, addToast, language } = useTeacherStore();

  const [cohortId, setCohortId] = useState(defaultCohortId);
  const [fullName, setFullName] = useState('');
  const [nickname, setNickname] = useState('');
  const [gender, setGender] = useState<'M' | 'F' | 'other'>('M');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [guardianEmail, setGuardianEmail] = useState('');
  const [strengths, setStrengths] = useState('');
  const [growthAreas, setGrowthAreas] = useState('');
  const [notes, setNotes] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (studentToEdit) {
      setCohortId(studentToEdit.cohortId);
      setFullName(studentToEdit.fullName);
      setNickname(studentToEdit.nickname || '');
      setGender(studentToEdit.gender || 'M');
      setDateOfBirth(studentToEdit.dateOfBirth || '');
      setGuardianName(studentToEdit.guardianName || '');
      setGuardianPhone(studentToEdit.guardianPhone || '');
      setGuardianEmail(studentToEdit.guardianEmail || '');
      setStrengths(studentToEdit.strengths || '');
      setGrowthAreas(studentToEdit.growthAreas || '');
      setNotes(studentToEdit.notes || '');
      setIsActive(studentToEdit.isActive ?? true);
    } else {
      setCohortId(defaultCohortId);
      setFullName('');
      setNickname('');
      setGender('M');
      setDateOfBirth('');
      setGuardianName('');
      setGuardianPhone('');
      setGuardianEmail('');
      setStrengths('');
      setGrowthAreas('');
      setNotes('');
      setIsActive(true);
    }
  }, [studentToEdit, defaultCohortId, isOpen]);

  useEscapeKey(onClose, isOpen);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      addToast(language === 'id' ? 'Nama lengkap siswa wajib diisi!' : 'Student full name is required!', 'warning');
      return;
    }

    if (studentToEdit) {
      updateStudent(studentToEdit.id, {
        cohortId,
        fullName: fullName.trim(),
        nickname: (nickname.trim() || fullName.trim().split(' ')[0]) || '',
        gender,
        dateOfBirth: dateOfBirth || undefined,
        guardianName: guardianName.trim(),
        guardianPhone: guardianPhone.trim(),
        guardianEmail: guardianEmail.trim() || undefined,
        strengths: strengths.trim() || undefined,
        growthAreas: growthAreas.trim() || undefined,
        notes: notes.trim() || undefined,
        isActive,
      });
      addToast(language === 'id' ? 'Data siswa berhasil diperbarui!' : 'Student profile updated successfully!', 'success');
    } else {
      const newStudent: Student = {
        id: `student-${Date.now()}`,
        cohortId,
        fullName: fullName.trim(),
        nickname: (nickname.trim() || fullName.trim().split(' ')[0]) || 'Siswa',
        gender,
        dateOfBirth: dateOfBirth || undefined,
        guardianName: guardianName.trim() || 'Wali Murid',
        guardianPhone: guardianPhone.trim() || '+628123456789',
        guardianEmail: guardianEmail.trim() || undefined,
        strengths: strengths.trim() || undefined,
        growthAreas: growthAreas.trim() || undefined,
        notes: notes.trim() || undefined,
        isActive: true,
      };
      addStudent(newStudent);
      addToast(language === 'id' ? 'Siswa baru berhasil ditambahkan!' : 'New student added successfully!', 'success');
    }

    onClose();
  };

  const isEditing = !!studentToEdit;

  return (
    <div className="fixed inset-0 z-50 scrim backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-stone-200 p-6 sm:p-7 space-y-5 animate-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-800 text-white flex items-center justify-center shadow-xs">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-stone-900 tracking-tight">
                {isEditing
                  ? (language === 'id' ? 'Edit Profil Siswa' : 'Edit Student Profile')
                  : (language === 'id' ? 'Tambah Siswa Baru' : 'Add New Student')}
              </h3>
              <p className="text-xs text-stone-500 font-medium">
                {language === 'id'
                  ? 'Lengkapi data identitas siswa, kontak wali murid, dan catatan observasi.'
                  : 'Fill in student details, guardian contacts, and pedagogical notes.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup / Close"
            className="text-stone-400 hover:text-stone-600 p-2 rounded-xl hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Cohort Selection */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              {language === 'id' ? 'Kelas / Rombongan Belajar' : 'Assigned Cohort'} *
            </label>
            <select
                aria-label={language === 'id' ? 'Rombel' : 'Cohort'}
              value={cohortId}
              onChange={(e) => setCohortId(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-teal-700 focus:bg-white text-stone-800 font-bold"
            >
              {cohorts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.cefrLevel})
                </option>
              ))}
            </select>
          </div>

          {/* Full Name & Nickname */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-8">
              <label className="block text-xs font-bold text-stone-700 mb-1">
                {language === 'id' ? 'Nama Lengkap Siswa' : 'Full Name'} *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Liam Michael Wong"
                className="w-full px-3.5 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-teal-700 focus:bg-white text-stone-800"
              />
            </div>

            <div className="sm:col-span-4">
              <label className="block text-xs font-bold text-stone-700 mb-1">
                {language === 'id' ? 'Nama Panggilan' : 'Nickname'}
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="e.g. Liam"
                className="w-full px-3.5 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-teal-700 focus:bg-white text-stone-800 font-medium"
              />
            </div>
          </div>

          {/* Gender & DOB */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                {language === 'id' ? 'Jenis Kelamin' : 'Gender'}
              </label>
              <div className="flex gap-2">
                {[
                  { key: 'M', label: language === 'id' ? 'Laki-laki (L)' : 'Male (M)' },
                  { key: 'F', label: language === 'id' ? 'Perempuan (P)' : 'Female (F)' },
                  { key: 'other', label: 'Other' },
                ].map((g) => (
                  <button
                    type="button"
                    key={g.key}
                    onClick={() => setGender(g.key as 'M' | 'F' | 'other')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      gender === g.key
                        ? 'bg-teal-800 text-white shadow-xs'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                {language === 'id' ? 'Tanggal Lahir' : 'Date of Birth'}
              </label>
              <input
                type="date"
                aria-label={language === 'id' ? 'Tanggal lahir' : 'Date of birth'}
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-teal-700 focus:bg-white text-stone-800 font-mono"
              />
            </div>
          </div>

          {/* Guardian Information Section */}
          <div className="bg-stone-50/70 p-4 rounded-2xl border border-stone-200/80 space-y-3">
            <h4 className="text-xs font-extrabold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-teal-700" />
              {language === 'id' ? 'Kontak Orang Tua / Wali Murid' : 'Guardian & Contact Info'}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {language === 'id' ? 'Nama Orang Tua / Wali' : 'Guardian Name'}
                </label>
                <input
                  type="text"
                  value={guardianName}
                  onChange={(e) => setGuardianName(e.target.value)}
                  placeholder="e.g. Mrs. Linda Wong"
                  className="w-full px-3 py-2 text-xs bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-teal-700 text-stone-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {language === 'id' ? 'No. WhatsApp Wali' : 'WhatsApp Number'}
                </label>
                <input
                  type="tel"
                  value={guardianPhone}
                  onChange={(e) => setGuardianPhone(e.target.value)}
                  placeholder="e.g. +6281234567890"
                  className="w-full px-3 py-2 text-xs bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-teal-700 text-stone-800 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-stone-400" />
                {language === 'id' ? 'Email Wali (Opsional)' : 'Guardian Email (Optional)'}
              </label>
              <input
                type="email"
                value={guardianEmail}
                onChange={(e) => setGuardianEmail(e.target.value)}
                placeholder="e.g. linda.wong@example.com"
                className="w-full px-3 py-2 text-xs bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-teal-700 text-stone-800"
              />
            </div>
          </div>

          {/* Academic Strengths & Growth Areas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                {language === 'id' ? 'Kelebihan / Kekuatan Siswa' : 'Academic Strengths'}
              </label>
              <textarea
                rows={2}
                value={strengths}
                onChange={(e) => setStrengths(e.target.value)}
                placeholder="e.g. Confident speaker, enthusiastic in roleplay activities..."
                className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-teal-700 focus:bg-white text-stone-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-amber-700" />
                {language === 'id' ? 'Area yang Perlu Ditingkatkan' : 'Growth Areas'}
              </label>
              <textarea
                rows={2}
                value={growthAreas}
                onChange={(e) => setGrowthAreas(e.target.value)}
                placeholder="e.g. Spelling of irregular past verbs, concentration during reading..."
                className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-teal-700 focus:bg-white text-stone-800"
              />
            </div>
          </div>

          {/* General Notes */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-stone-400" />
              {language === 'id' ? 'Catatan Umum Guru' : 'Teacher Observation Log'}
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Sits near the front row. Responsive to visual flashcards."
              className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-teal-700 focus:bg-white text-stone-800"
            />
          </div>

          {/* Active Status (Edit mode only) */}
          {isEditing && (
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="studentActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded text-teal-700 focus:ring-teal-700"
              />
              <label htmlFor="studentActive" className="text-xs font-bold text-stone-700 cursor-pointer">
                {language === 'id' ? 'Status Siswa Aktif Terdaftar' : 'Student is Actively Enrolled'}
              </label>
            </div>
          )}

          {/* Submit & Cancel Buttons */}
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
                ? (language === 'id' ? 'Simpan Data Siswa' : 'Save Student')
                : (language === 'id' ? 'Tambah Siswa' : 'Add Student')}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
