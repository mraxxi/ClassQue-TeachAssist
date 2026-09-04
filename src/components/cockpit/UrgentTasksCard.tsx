import React, { useState } from 'react';
import { CheckSquare2, Square, Plus, Trash2, Calendar, AlertCircle } from 'lucide-react';
import { useTeacherStore } from '../../store/useTeacherStore';
import { useTranslation } from '../../utils/i18n';
import { TaskItem } from '../../types';

export const UrgentTasksCard: React.FC = () => {
  const { tasks, toggleTask, addTask, deleteTask, language, teacher } = useTeacherStore();
  const t = useTranslation(language);
  const [newTitle, setNewTitle] = useState('');

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newTask: TaskItem = {
      id: `task-${Date.now()}`,
      teacherId: teacher.id,
      title: newTitle.trim(),
      priority: 'high',
      dueDate: new Date().toISOString().split('T')[0],
      isCompleted: false,
    };

    addTask(newTask);
    setNewTitle('');
  };

  const pendingCount = tasks.filter((tk) => !tk.isCompleted).length;

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
      </div>

      {/* Quick Add Input */}
      <form onSubmit={handleCreateTask} className="flex items-center gap-2 mb-4">
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
      </form>

      {/* Tasks List */}
      <div className="space-y-2 flex-1 overflow-y-auto max-h-[260px] pr-1">
        {tasks.map((task) => (
          <div
            key={task.id}
            className={`flex items-start justify-between gap-2.5 p-2.5 rounded-xl border transition-all ${
              task.isCompleted
                ? 'bg-stone-50/70 border-stone-200/50 opacity-60'
                : 'bg-white border-stone-200 hover:border-stone-300 shadow-2xs'
            }`}
          >
            <button
              onClick={() => toggleTask(task.id)}
              className="mt-0.5 text-stone-400 hover:text-teal-700 transition-colors shrink-0 cursor-pointer"
            >
              {task.isCompleted ? (
                <CheckSquare2 className="w-4 h-4 text-emerald-600" />
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
              <div className="flex items-center gap-2 mt-1 text-[10px] text-stone-400 font-medium">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {t.cockpit.due} {task.dueDate}
                </span>
                {task.priority === 'urgent' && (
                  <span className="text-rose-600 font-bold bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200 flex items-center gap-0.5">
                    <AlertCircle className="w-2.5 h-2.5" /> Urgent
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={() => deleteTask(task.id)}
              className="text-stone-300 hover:text-rose-600 p-1 transition-colors shrink-0"
              title="Delete task"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
