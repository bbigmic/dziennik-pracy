'use client';

import { useState } from 'react';
import { format, isPast, isToday, parseISO, isBefore } from 'date-fns';
import { pl } from 'date-fns/locale';
import { AssignedTask } from '@/types';
import {
  Trash2,
  Edit3,
  Check,
  X,
  CheckCircle,
  Briefcase,
  ListTodo,
  ChevronDown,
  ChevronUp,
  Calendar,
  AlertCircle,
  Clock,
} from 'lucide-react';

interface AssignedTasksProps {
  tasks: AssignedTask[];
  onAddTask: (task: Omit<AssignedTask, 'id' | 'createdAt' | 'completed'>) => void;
  onRemoveTask: (taskId: string) => void;
  onUpdateTask: (taskId: string, updates: Partial<AssignedTask>) => void;
  onMarkAsDone: (taskId: string, taskTitle: string) => void;
}

const priorityColors = {
  low: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
  medium: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
  high: 'text-rose-400 bg-rose-400/10 border-rose-400/30',
};

const priorityLabels = {
  low: 'Niski',
  medium: 'Średni',
  high: 'Wysoki',
};

type FormMode = null | 'responsibility' | 'todo';

// Komponenty wyciągnięte poza główny komponent, żeby nie były re-tworzone przy każdym renderze
function PrioritySelector({ value, onChange }: { 
  value: 'low' | 'medium' | 'high'; 
  onChange: (p: 'low' | 'medium' | 'high') => void 
}) {
  return (
    <div className="flex gap-1.5 sm:gap-2">
      {(['low', 'medium', 'high'] as const).map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onChange(p)}
          className={`
            flex-1 py-2 px-2 sm:px-3 rounded-lg sm:rounded-xl border-2 transition-all font-medium text-xs sm:text-sm
            ${value === p 
              ? priorityColors[p] + ' border-current' 
              : 'border-[var(--border-color)] text-[var(--text-muted)] hover:border-[var(--text-muted)]'
            }
          `}
        >
          {priorityLabels[p]}
        </button>
      ))}
    </div>
  );
}

function DeadlineInputs({ deadline, deadlineTime, onChange }: { 
  deadline: string; 
  deadlineTime: string; 
  onChange: (field: 'deadline' | 'deadlineTime', value: string) => void 
}) {
  return (
    <div>
      <label className="text-xs sm:text-sm text-[var(--text-muted)] mb-2 block">
        Termin (opcjonalnie)
      </label>
      <div className="flex gap-2">
        <div className="flex-1">
          <input
            type="date"
            value={deadline}
            onChange={e => onChange('deadline', e.target.value)}
            className="input-field"
          />
        </div>
        {deadline && (
          <div className="w-28 sm:w-32">
            <input
              type="time"
              value={deadlineTime}
              onChange={e => onChange('deadlineTime', e.target.value)}
              className="input-field"
            />
          </div>
        )}
      </div>
    </div>
  );
}

function getDeadlineStatus(deadline: string, deadlineTime?: string) {
  const now = new Date();
  let deadlineDate = parseISO(deadline);
  
  if (deadlineTime) {
    const [hours, minutes] = deadlineTime.split(':').map(Number);
    deadlineDate = new Date(deadlineDate);
    deadlineDate.setHours(hours, minutes, 0, 0);
  } else {
    deadlineDate = new Date(deadlineDate);
    deadlineDate.setHours(23, 59, 59, 999);
  }
  
  if (isBefore(deadlineDate, now)) return 'overdue';
  if (isToday(parseISO(deadline))) return 'today';
  return 'upcoming';
}

function formatDeadline(deadline: string, deadlineTime?: string) {
  const dateStr = format(parseISO(deadline), 'd MMM', { locale: pl });
  if (deadlineTime) {
    return `${dateStr}, ${deadlineTime}`;
  }
  return dateStr;
}

export default function AssignedTasks({
  tasks,
  onAddTask,
  onRemoveTask,
  onUpdateTask,
  onMarkAsDone,
}: AssignedTasksProps) {
  const [formMode, setFormMode] = useState<FormMode>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState({
    responsibilities: true,
    todos: true,
  });

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    deadline: '',
    deadlineTime: '',
  });

  const responsibilities = tasks.filter(t => t.category === 'responsibility');
  const todos = tasks.filter(t => t.category === 'todo');

  const resetForm = () => {
    setFormData({ title: '', description: '', priority: 'medium', deadline: '', deadlineTime: '' });
    setFormMode(null);
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.title.trim() && formMode) {
      onAddTask({
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        category: formMode,
        priority: formData.priority,
        deadline: formMode === 'todo' && formData.deadline ? formData.deadline : undefined,
        deadlineTime: formMode === 'todo' && formData.deadline && formData.deadlineTime ? formData.deadlineTime : undefined,
      });
      resetForm();
    }
  };

  const handleEdit = (task: AssignedTask) => {
    setEditingId(task.id);
    setFormData({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      deadline: task.deadline || '',
      deadlineTime: task.deadlineTime || '',
    });
  };

  const saveEdit = () => {
    if (editingId && formData.title.trim()) {
      const task = tasks.find(t => t.id === editingId);
      onUpdateTask(editingId, {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        priority: formData.priority,
        deadline: task?.category === 'todo' && formData.deadline ? formData.deadline : undefined,
        deadlineTime: task?.category === 'todo' && formData.deadline && formData.deadlineTime ? formData.deadlineTime : undefined,
      });
    }
    resetForm();
  };

  const toggleSection = (section: 'responsibilities' | 'todos') => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleFormChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const renderTaskCard = (task: AssignedTask, isTodo: boolean) => {
    if (editingId === task.id) {
      return (
        <div key={task.id} className="card p-3 sm:p-4">
          <div className="space-y-3">
            <input
              type="text"
              value={formData.title}
              onChange={e => handleFormChange('title', e.target.value)}
              className="input-field"
              placeholder="Tytuł"
              autoFocus
            />
            <textarea
              value={formData.description}
              onChange={e => handleFormChange('description', e.target.value)}
              className="input-field min-h-[60px] resize-none"
              placeholder="Opis (opcjonalnie)"
            />
            {isTodo && (
              <DeadlineInputs
                deadline={formData.deadline}
                deadlineTime={formData.deadlineTime}
                onChange={handleFormChange}
              />
            )}
            <div>
              <label className="text-xs sm:text-sm text-[var(--text-muted)] mb-2 block">Priorytet</label>
              <PrioritySelector 
                value={formData.priority} 
                onChange={(p) => handleFormChange('priority', p)} 
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={resetForm}
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
        </div>
      );
    }

    const deadlineStatus = task.deadline ? getDeadlineStatus(task.deadline, task.deadlineTime) : null;

    return (
      <div key={task.id} className="card p-3 sm:p-4 transition-all">
        <div className="flex items-start gap-2 sm:gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
              <h4 className="font-semibold text-sm sm:text-base">
                {task.title}
              </h4>
              <span
                className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full border ${priorityColors[task.priority]}`}
              >
                {priorityLabels[task.priority]}
              </span>
            </div>
            {task.description && (
              <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1 break-words">
                {task.description}
              </p>
            )}
            {task.deadline && (
              <div className={`flex items-center gap-1 mt-2 text-xs sm:text-sm ${
                deadlineStatus === 'overdue' 
                  ? 'text-rose-400' 
                  : deadlineStatus === 'today' 
                  ? 'text-amber-400' 
                  : 'text-[var(--text-muted)]'
              }`}>
                {deadlineStatus === 'overdue' ? (
                  <AlertCircle className="w-3.5 h-3.5" />
                ) : task.deadlineTime ? (
                  <Clock className="w-3.5 h-3.5" />
                ) : (
                  <Calendar className="w-3.5 h-3.5" />
                )}
                <span>
                  {deadlineStatus === 'overdue' && 'Przeterminowane: '}
                  {deadlineStatus === 'today' && 'Dziś: '}
                  {formatDeadline(task.deadline, task.deadlineTime)}
                </span>
              </div>
            )}
          </div>

          <div className="flex gap-1 flex-shrink-0">
            {isTodo && (
              <button
                onClick={() => onMarkAsDone(task.id, task.title)}
                className="p-1.5 sm:p-2 rounded-lg bg-[var(--success)]/20 hover:bg-[var(--success)]/30 transition-colors text-[var(--success)] active:scale-95"
                title="Oznacz jako wykonane"
              >
                <CheckCircle className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => handleEdit(task)}
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
      </div>
    );
  };

  const renderAddForm = (category: 'responsibility' | 'todo') => {
    const isResponsibility = category === 'responsibility';
    const isTodo = category === 'todo';
    
    return (
      <div className="card p-4 sm:p-5 mb-4 animate-slide-up">
        <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">
          {isResponsibility ? 'Nowy obszar odpowiedzialności' : 'Nowe zadanie'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <input
            type="text"
            value={formData.title}
            onChange={e => handleFormChange('title', e.target.value)}
            className="input-field"
            placeholder={isResponsibility ? "Nazwa obszaru" : "Tytuł zadania"}
            autoFocus
          />
          <textarea
            value={formData.description}
            onChange={e => handleFormChange('description', e.target.value)}
            className="input-field min-h-[70px] sm:min-h-[80px] resize-none"
            placeholder="Opis (opcjonalnie)"
          />
          {isTodo && (
            <DeadlineInputs
              deadline={formData.deadline}
              deadlineTime={formData.deadlineTime}
              onChange={handleFormChange}
            />
          )}
          <div>
            <label className="text-xs sm:text-sm text-[var(--text-muted)] mb-2 block">Priorytet</label>
            <PrioritySelector 
              value={formData.priority} 
              onChange={(p) => handleFormChange('priority', p)} 
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={resetForm}
              className="flex-1 py-2.5 px-3 sm:px-4 rounded-lg sm:rounded-xl bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] transition-colors text-sm sm:text-base active:scale-[0.98]"
            >
              Anuluj
            </button>
            <button type="submit" className="flex-1 btn-primary active:scale-[0.98]">
              Dodaj
            </button>
          </div>
        </form>
      </div>
    );
  };

  return (
    <div className="w-full max-w-5xl mx-auto mt-8 sm:mt-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold">Przypisane zadania</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setFormMode('responsibility')}
            className="btn-primary flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 text-sm sm:text-base active:scale-[0.98]"
          >
            <Briefcase className="w-4 h-4" />
            <span>Dodaj</span> obszar
          </button>
          <button
            onClick={() => setFormMode('todo')}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base
                       bg-amber-500/20 text-amber-400 border border-amber-500/30
                       hover:bg-amber-500/30 transition-all active:scale-[0.98]"
          >
            <ListTodo className="w-4 h-4" />
            <span>Dodaj</span> zadanie
          </button>
        </div>
      </div>

      {/* Add form for responsibility */}
      {formMode === 'responsibility' && renderAddForm('responsibility')}
      
      {/* Add form for todo */}
      {formMode === 'todo' && renderAddForm('todo')}

      {/* Responsibilities section */}
      <div className="mb-4 sm:mb-6">
        <button
          onClick={() => toggleSection('responsibilities')}
          className="w-full flex items-center justify-between p-3 sm:p-4 rounded-lg sm:rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:border-[var(--accent-primary)] transition-all mb-2 sm:mb-3 active:scale-[0.99]"
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-lg bg-[var(--accent-primary)]/20">
              <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--accent-secondary)]" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-sm sm:text-base">Obszary odpowiedzialności</h3>
              <p className="text-xs sm:text-sm text-[var(--text-muted)]">
                {responsibilities.length} {responsibilities.length === 1 ? 'obszar' : 'obszarów'}
              </p>
            </div>
          </div>
          {expandedSections.responsibilities ? (
            <ChevronUp className="w-5 h-5 text-[var(--text-muted)]" />
          ) : (
            <ChevronDown className="w-5 h-5 text-[var(--text-muted)]" />
          )}
        </button>

        {expandedSections.responsibilities && (
          <div className="space-y-2 sm:space-y-3 pl-2 sm:pl-4">
            {responsibilities.length === 0 ? (
              <p className="text-[var(--text-muted)] text-xs sm:text-sm py-3 sm:py-4 text-center">
                Brak przypisanych obszarów odpowiedzialności
              </p>
            ) : (
              responsibilities.map(task => renderTaskCard(task, false))
            )}
          </div>
        )}
      </div>

      {/* Todos section */}
      <div>
        <button
          onClick={() => toggleSection('todos')}
          className="w-full flex items-center justify-between p-3 sm:p-4 rounded-lg sm:rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:border-[var(--accent-primary)] transition-all mb-2 sm:mb-3 active:scale-[0.99]"
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-lg bg-amber-500/20">
              <ListTodo className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-sm sm:text-base">Do zrobienia</h3>
              <p className="text-xs sm:text-sm text-[var(--text-muted)]">
                {todos.length} {todos.length === 1 ? 'zadanie' : 'zadań'}
              </p>
            </div>
          </div>
          {expandedSections.todos ? (
            <ChevronUp className="w-5 h-5 text-[var(--text-muted)]" />
          ) : (
            <ChevronDown className="w-5 h-5 text-[var(--text-muted)]" />
          )}
        </button>

        {expandedSections.todos && (
          <div className="space-y-2 sm:space-y-3 pl-2 sm:pl-4">
            {todos.length === 0 ? (
              <p className="text-[var(--text-muted)] text-xs sm:text-sm py-3 sm:py-4 text-center">
                Brak zadań do zrobienia
              </p>
            ) : (
              todos.map(task => renderTaskCard(task, true))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
