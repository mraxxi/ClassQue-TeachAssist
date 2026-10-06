import React, { useState, useMemo } from 'react';
import { 
  CheckSquare2, Square, Plus, Trash2, Calendar, 
  AlertCircle, GraduationCap, ChevronDown, ChevronUp 
} from 'lucide-react';
import { useTeacherStore } from '../../store/useTeacherStore';
import { useTranslation } from '../../utils/i18n';
import { TaskItem, TaskPriority } from '../../types';
import { useNow } from '../../hooks/useCockpitCohort';
import { localDateStr } from '../../utils/date';
import { getUpcomingLessonSlots } from '../../utils/schedule';

export const UrgentTasksCard: React.FC = () => {
  const { tasks, toggleTask, addTask, deleteTask, cohorts, language, teacher } = useTeacherStore();
  const t = useTranslation(language);

  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [deadlineMode, setDeadlineMode] = useState<'date' | 'lesson'>('date');
  const [priority, setPriority] = useState<TaskPriority>('high');
  const [customDate, setCustomDate] = useState<string>(() => localDateStr());
  const [selectedCohortId, setSelectedCohortId] = useState<string>(() => cohorts[0]?.id || '');
  const [selectedLessonSlot, setSelectedLessonSlot] = useState<string>('');

  // Compute upcoming lesson occurrences for selected cohort
  const selectedCohort = cohorts.find((c) => c.id === selectedCohortId) || cohorts[0];

  const now = useNow(60_000);
  const todayStr = localDateStr(now);

  // Upcoming lessons of the selected cohort; a class that already finished today is not offered.
  const upcomingLessonSlots = useMemo(() => {
    return getUpcomingLessonSlots(selectedCohort, 5, now).map((slot, i) => {
      const weekday = new Intl.DateTimeFormat(language === 'id' ? 'id-ID' : 'en-US', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      }).format(slot.start);
      const tag = i === 0 ? (language === 'id' ? 'Sesi Terdekat' : 'Next Session') : `+${i + 1}`;
      return {
        dateStr: slot.dateStr,
        // Clean label that is stored on the task and shown on its badge.
        label: `${weekday} (${slot.startTime})`,
        // Richer label for the picker only.
        fullLabel: `${weekday} (${slot.startTime}) • ${tag}`,
      };
    });
  }, [selectedCohort, language, now]);

  // Set default slot when cohort changes
  const effectiveSlot = selectedLessonSlot || upcomingLessonSlots[0]?.dateStr || '';

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    let finalDueDate = customDate;
    let dueLessonLabel: string | undefined = undefined;

    if (deadlineMode === 'lesson' && selectedCohort) {
      const matchedSlot = upcomingLessonSlots.find((s) => s.dateStr === effectiveSlot) || upcomingLessonSlots[0];
      finalDueDate = matchedSlot ? matchedSlot.dateStr : customDate;
      dueLessonLabel = matchedSlot ? `${selectedCohort.name} • ${matchedSlot.label}` : selectedCohort.name;
    }

    const newTask: TaskItem = {
      id: `task-${Date.now()}`,
      teacherId: teacher.id,
      cohortId: deadlineMode === 'lesson' ? selectedCohort?.id : undefined,
      title: newTitle.trim(),
      priority,
      dueDate: finalDueDate,
      deadlineType: deadlineMode,
      dueLessonLabel,
      isCompleted: false,
      createdAt: new Date().toISOString(),
    };

    addTask(newTask);
    setNewTitle('');
    setShowOptions(false);
  };

  const pendingCount = tasks.filter((tk) => !tk.isCompleted).length;
  // Open tasks first (earliest deadline first), finished ones last.
  const orderedTasks = [...tasks].sort((a, b) =>
    a.isCompleted !== b.isCompleted ? (a.isCompleted ? 1 : -1) : (a.dueDate || '9999').localeCompare(b.dueDate || '9999')
  );

  return (
    <div className="bg-white rounded-2xl p-6 border border-stone-200/90 shadow-xs flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-extrabold text-stone-900">
            {t.cockpit.urgentTasks}
          </h3>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            {pendingCount}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setShowOptions(!showOptions)}
          className="text-xs font-medium text-teal-800 hover:text-teal-900 flex items-center gap-1 cursor-pointer"
        >
          <span>{deadlineMode === 'lesson' ? '🎓 ' + t.cockpit.cohortLesson : '📅 ' + t.cockpit.calendarDate}</span>
          {showOptions ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Quick Add Input & Optional Deadline Picker */}
      <form onSubmit={handleCreateTask} className="mb-4 space-y-2">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder={t.cockpit.addTaskPlaceholder}
            className="flex-1 px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-700 focus:bg-white transition-all text-stone-800 placeholder-stone-400"
          />
          <button
            type="submit"
            className="px-3 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold transition-all shrink-0 flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.cockpit.add}</span>
          </button>
        </div>

        {/* Expandable Deadline & Cohort Picker Options */}
        {showOptions && (
          <div className="p-3 bg-stone-50/90 rounded-xl border border-stone-200/80 space-y-2.5 text-xs animate-in fade-in duration-150">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-stone-700 text-[11px]">
                {t.cockpit.deadlineMethod}:
              </span>
              <div className="flex items-center bg-stone-200/70 p-0.5 rounded-lg">
                <button
                  type="button"
                  onClick={() => setDeadlineMode('date')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                    deadlineMode === 'date'
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  📅 {t.cockpit.calendarDate}
                </button>
                <button
                  type="button"
                  onClick={() => setDeadlineMode('lesson')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                    deadlineMode === 'lesson'
                      ? 'bg-teal-800 text-white shadow-xs'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  🎓 {t.cockpit.cohortLesson}
                </button>
              </div>
            </div>

            {deadlineMode === 'date' ? (
              <div className="flex items-center gap-2">
                <span className="text-stone-500 text-[11px] shrink-0">
                  {t.cockpit.pickDate}
                </span>
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-teal-700"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-stone-500 text-[11px] shrink-0">
                    {t.cockpit.targetCohort}:
                  </span>
                  <select
                    value={selectedCohortId}
                    onChange={(e) => {
                      setSelectedCohortId(e.target.value);
                      setSelectedLessonSlot('');
                    }}
                    className="flex-1 px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-semibold text-stone-800 focus:outline-none focus:ring-1 focus:ring-teal-700 cursor-pointer"
                  >
                    {cohorts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.cefrLevel})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-stone-500 text-[11px] shrink-0">
                    {t.cockpit.lessonSlot}:
                  </span>
                  <select
                    value={effectiveSlot}
                    onChange={(e) => setSelectedLessonSlot(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-teal-700 cursor-pointer"
                  >
                    {upcomingLessonSlots.map((slot) => (
                      <option key={slot.dateStr} value={slot.dateStr}>
                        {slot.fullLabel}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Priority Picker */}
            <div className="flex items-center justify-between pt-1 border-t border-stone-200/60 text-[11px]">
              <span className="text-stone-500 font-medium">{t.cockpit.priorityLabel}:</span>
              <div className="flex items-center gap-1.5">
                {(['medium', 'high', 'urgent'] as TaskPriority[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`px-2 py-0.5 rounded-md font-semibold capitalize cursor-pointer ${
                      priority === p
                        ? p === 'urgent'
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : 'bg-teal-100 text-teal-800 border border-teal-300'
                        : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </form>

      {/* Tasks List */}
      <div className="space-y-2 flex-1 overflow-y-auto max-h-[300px] pr-1">
        {tasks.length === 0 ? (
          <div className="py-8 text-center text-stone-400 text-xs">
            {language === 'id' ? 'Tidak ada tugas tertunda.' : 'No pending tasks.'}
          </div>
        ) : (
          orderedTasks.map((task) => (
            <div
              key={task.id}
              data-testid="task-row"
              className={`flex items-start justify-between gap-2.5 p-2.5 rounded-xl border transition-all ${
                task.isCompleted
                  ? 'bg-stone-50/70 border-stone-200/50 opacity-60'
                  : 'bg-white border-stone-200 hover:border-stone-300 shadow-2xs'
              }`}
            >
              <button
                type="button"
                onClick={() => toggleTask(task.id)}
                aria-label={`${task.isCompleted ? (language === 'id' ? 'Tandai belum selesai' : 'Mark as not done') : (language === 'id' ? 'Tandai selesai' : 'Mark as done')}: ${task.title}`}
                aria-pressed={task.isCompleted}
                className="mt-0.5 text-stone-500 hover:text-teal-700 transition-colors shrink-0 cursor-pointer"
              >
                {task.isCompleted ? (
                  <CheckSquare2 className="w-4 h-4 text-emerald-700" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
              </button>

              <div className="flex-1 min-w-0" onClick={() => toggleTask(task.id)}>
                <p
                  className={`text-xs font-medium leading-snug cursor-pointer select-none ${
                    task.isCompleted ? 'line-through text-stone-400' : 'text-stone-800'
                  }`}
                >
                  {task.title}
                </p>
                <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[10px] text-stone-400 font-medium">
                  {task.deadlineType === 'lesson' ? (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200/70 font-semibold">
                      <GraduationCap className="w-3 h-3 text-teal-600 shrink-0" />
                      <span className="truncate max-w-[210px]">{task.dueLessonLabel || task.dueDate}</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {t.cockpit.due} {task.dueDate}
                    </span>
                  )}

                  {!task.isCompleted && task.dueDate && task.dueDate < todayStr && (
                    <span className="text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 flex items-center gap-0.5" data-testid="task-overdue">
                      <AlertCircle className="w-2.5 h-2.5" /> {t.cockpit.overdue}
                    </span>
                  )}

                  {task.priority === 'urgent' && (
                    <span className="text-rose-700 font-bold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 flex items-center gap-0.5">
                      <AlertCircle className="w-2.5 h-2.5" /> Urgent
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => deleteTask(task.id)}
                className="text-stone-300 hover:text-rose-700 p-1 transition-colors shrink-0 cursor-pointer"
                title={language === 'id' ? 'Hapus tugas' : 'Delete task'}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
