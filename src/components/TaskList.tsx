'use client';

import { useState } from 'react';
import { Task } from '@/types';
import { Trash2, Edit3, Check, X } from 'lucide-react';
import { format } from 'date-fns';

interface TaskListProps {
  tasks: Task[];
  onRemoveTask: (taskId: string) => void;
  onUpdateTask: (taskId: string, newText: string) => void;
}

export default function TaskList({
  tasks,
  onRemoveTask,
  onUpdateTask,
}: TaskListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const startEditing = (task: Task) => {
    setEditingId(task.id);
    setEditText(task.text);
  };

  const saveEdit = () => {
    if (editingId && editText.trim()) {
      onUpdateTask(editingId, editText.trim());
    }
    setEditingId(null);
    setEditText('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center py-6 sm:py-8">
        <p className="text-[var(--text-muted)] text-sm sm:text-base">
          Brak wpisów dla tego dnia.
        </p>
        <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
          Nagraj głosówkę, aby dodać nowy wpis.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2 sm:space-y-3">
      {tasks.map((task, index) => (
        <div
          key={task.id}
          className="card p-3 sm:p-4 animate-slide-up"
          style={{ animationDelay: `${index * 0.05}s` }}
        >
          {editingId === task.id ? (
            <div className="flex flex-col gap-3">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="input-field min-h-[80px] sm:min-h-[100px] resize-none"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={cancelEdit}
                  className="p-2 rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--danger)] transition-colors active:scale-95"
                >
                  <X className="w-4 h-4" />
                </button>
                <button
                  onClick={saveEdit}
                  className="p-2 rounded-lg bg-[var(--success)] hover:bg-[var(--success)]/80 transition-colors active:scale-95"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-[var(--text-primary)] leading-relaxed mb-2 sm:mb-3 text-sm sm:text-base break-words">
                {task.text}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs text-[var(--text-muted)]">
                  {format(new Date(task.createdAt), 'HH:mm')}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => startEditing(task)}
                    className="p-1.5 sm:p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors text-[var(--text-muted)] hover:text-[var(--accent-secondary)] active:scale-95"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onRemoveTask(task.id)}
                    className="p-1.5 sm:p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors text-[var(--text-muted)] hover:text-[var(--danger)] active:scale-95"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
