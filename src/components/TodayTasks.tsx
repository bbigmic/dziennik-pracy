'use client';

import { format, isToday, parseISO } from 'date-fns';
import { AssignedTask } from '@/types';
import { Clock, CheckCircle } from 'lucide-react';

interface TodayTasksProps {
  tasks: AssignedTask[];
  onMarkAsDone: (taskId: string, taskTitle: string) => void;
}

export default function TodayTasks({ tasks, onMarkAsDone }: TodayTasksProps) {
  const today = new Date();
  const todayKey = format(today, 'yyyy-MM-dd');

  // Filtruj zadania z deadline'em dzisiaj (tylko todo, nie completed)
  const todayTasks = tasks.filter((task) => {
    if (task.category !== 'todo' || task.completed || !task.deadline) {
      return false;
    }
    return isToday(parseISO(task.deadline));
  });

  if (todayTasks.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-5xl mx-auto mb-6 sm:mb-8">
      <div className="glass rounded-xl sm:rounded-2xl p-3 sm:p-4">
        <div className="flex items-center gap-2 mb-2 sm:mb-3">
          <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--accent-primary)]" />
          <h3 className="text-sm sm:text-base font-semibold text-[var(--text-primary)]">
            Zadania na dziś ({todayTasks.length})
          </h3>
        </div>
        <div className="space-y-1.5 sm:space-y-2">
          {todayTasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-2 sm:gap-3 py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-[var(--text-primary)] truncate">
                  {task.title}
                </p>
                {task.deadlineTime && (
                  <p className="text-[10px] sm:text-xs text-[var(--text-muted)] mt-0.5">
                    {task.deadlineTime}
                  </p>
                )}
              </div>
              <span
                className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full border ${
                  task.priority === 'high'
                    ? 'text-rose-400 bg-rose-400/10 border-rose-400/30'
                    : task.priority === 'medium'
                    ? 'text-amber-400 bg-amber-400/10 border-amber-400/30'
                    : 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30'
                }`}
              >
                {task.priority === 'high' ? 'Wysoki' : task.priority === 'medium' ? 'Średni' : 'Niski'}
              </span>
              <button
                onClick={() => onMarkAsDone(task.id, task.title)}
                className="p-1.5 sm:p-2 rounded-lg bg-[var(--success)]/20 hover:bg-[var(--success)]/30 transition-colors text-[var(--success)] active:scale-95 flex-shrink-0"
                title="Oznacz jako wykonane"
              >
                <CheckCircle className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

