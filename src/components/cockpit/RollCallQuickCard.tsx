import React from 'react';
import { CheckCheck } from 'lucide-react';
import { useTeacherStore } from '../../store/useTeacherStore';
import { useTranslation } from '../../utils/i18n';
import { AttendanceStatus } from '../../types';

export const RollCallQuickCard: React.FC = () => {
  const { 
    cohorts, students, attendanceRecords, setAttendance, 
    batchMarkAllPresent, language 
  } = useTeacherStore();
  const t = useTranslation(language);

  const activeCohort = cohorts[0] || null;
  const cohortStudents = students.filter((s) => s.cohortId === activeCohort?.id);
  const todayDate = new Date().toISOString().split('T')[0];

  const getStudentStatus = (studentId: string): AttendanceStatus => {
    const record = attendanceRecords.find(
      (r) => r.studentId === studentId && r.attendanceDate === todayDate
    );
    return record?.status || 'present';
  };

  const statusOptions: { key: AttendanceStatus; label: string; activeClass: string; inactiveClass: string }[] = [
    { key: 'present', label: 'Hadir', activeClass: 'bg-emerald-500 text-white font-bold shadow-xs', inactiveClass: 'bg-stone-100 text-stone-600 hover:bg-stone-200' },
    { key: 'absent', label: 'Alpa', activeClass: 'bg-rose-500 text-white font-bold shadow-xs', inactiveClass: 'bg-stone-100 text-stone-600 hover:bg-stone-200' },
    { key: 'late', label: 'Terlambat', activeClass: 'bg-amber-500 text-white font-bold shadow-xs', inactiveClass: 'bg-stone-100 text-stone-600 hover:bg-stone-200' },
    { key: 'excused', label: 'Izin', activeClass: 'bg-sky-500 text-white font-bold shadow-xs', inactiveClass: 'bg-stone-100 text-stone-600 hover:bg-stone-200' },
  ];

  return (
    <div className="bg-white rounded-2xl p-6 border border-stone-200/90 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-extrabold text-stone-900 flex items-center gap-2">
            {t.cockpit.rollCallTitle}
          </h3>
          <p className="text-xs text-stone-500 font-medium mt-0.5">
            {activeCohort?.name} • {cohortStudents.length} {t.cockpit.studentsCount}
          </p>
        </div>
        <button
          onClick={() => activeCohort && batchMarkAllPresent(activeCohort.id, todayDate)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition-colors"
        >
          <CheckCheck className="w-3.5 h-3.5 text-teal-700" />
          <span>{t.cockpit.markAllPresent}</span>
        </button>
      </div>

      {/* Student Rows */}
      <div className="divide-y divide-stone-100">
        {cohortStudents.map((student) => {
          const currentStatus = getStudentStatus(student.id);
          return (
            <div key={student.id} className="py-3 flex items-center justify-between gap-2">
              {/* Student Avatar & Nickname */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-stone-100 text-stone-700 font-bold text-xs flex items-center justify-center border border-stone-200 shrink-0">
                  {student?.nickname?.[0] || student?.fullName?.[0] || 'S'}
                </div>
                <div className="truncate">
                  <p className="text-sm font-semibold text-stone-800 truncate">{student.fullName}</p>
                  <p className="text-[11px] text-stone-400 truncate">({student.nickname})</p>
                </div>
              </div>

              {/* 1-Click Status Toggles */}
              <div className="flex items-center gap-1 bg-stone-100/90 p-1 rounded-xl border border-stone-200/60 shrink-0">
                {statusOptions.map((opt) => {
                  const isSelected = currentStatus === opt.key;
                  return (
                    <button
                      key={opt.key}
                      onClick={() => activeCohort && setAttendance(student.id, activeCohort.id, todayDate, opt.key)}
                      className={`px-2.5 py-1 rounded-lg text-xs transition-all cursor-pointer ${
                        isSelected ? opt.activeClass : opt.inactiveClass
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
