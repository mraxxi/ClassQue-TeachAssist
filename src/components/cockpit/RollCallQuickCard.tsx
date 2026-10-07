import React from 'react';
import { CheckCheck } from 'lucide-react';
import { useTeacherStore } from '../../store/useTeacherStore';
import { useTranslation } from '../../utils/i18n';
import { AttendanceStatus } from '../../types';
import { useCockpitCohort } from '../../hooks/useCockpitCohort';
import { AttendanceControl, RollCallProgress } from '../common/AttendanceControl';
import { localDateStr } from '../../utils/date';

export const RollCallQuickCard: React.FC = () => {
  const { 
    students, attendanceRecords, setAttendance, 
    batchMarkAllPresent, language 
  } = useTeacherStore();
  const t = useTranslation(language);

  const { active: activeCohort, now } = useCockpitCohort();
  const cohortStudents = students.filter((s) => s.cohortId === activeCohort?.id && s.isActive !== false);
  const todayDate = localDateStr(now);

  /** Unrecorded students have NO selected status (never silently "present"). */
  const getStudentStatus = (studentId: string): AttendanceStatus | undefined =>
    attendanceRecords.find((r) => r.studentId === studentId && r.attendanceDate === todayDate)?.status;

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
          <div className="mt-1.5">
            <RollCallProgress
              recorded={cohortStudents.filter((st) => getStudentStatus(st.id) !== undefined).length}
              total={cohortStudents.length}
              language={language}
            />
          </div>
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
            <div key={student.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
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
              <AttendanceControl
                value={currentStatus}
                language={language}
                label={student.fullName}
                dense
                onChange={(status) => activeCohort && setAttendance(student.id, activeCohort.id, todayDate, status)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
