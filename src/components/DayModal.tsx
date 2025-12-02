'use client';

import { useState, useCallback } from 'react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { X, Plus } from 'lucide-react';
import { DayEntry } from '@/types';
import AudioRecorder from './AudioRecorder';
import TaskList from './TaskList';

interface DayModalProps {
  date: Date;
  dayEntry: DayEntry | undefined;
  onClose: () => void;
  onAddTask: (text: string) => void;
  onRemoveTask: (taskId: string) => void;
  onUpdateTask: (taskId: string, newText: string) => void;
}

export default function DayModal({
  date,
  dayEntry,
  onClose,
  onAddTask,
  onRemoveTask,
  onUpdateTask,
}: DayModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  const handleTranscription = useCallback(
    async (transcribedText: string) => {
      setIsProcessing(true);
      try {
        const response = await fetch('/api/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: transcribedText,
            date: format(date, 'yyyy-MM-dd'),
          }),
        });

        if (!response.ok) {
          throw new Error('Processing failed');
        }

        const data = await response.json();
        if (data.processedText) {
          onAddTask(data.processedText);
        }
      } catch (error) {
        console.error('Error processing text:', error);
        // Fallback: add raw transcription if AI processing fails
        onAddTask(transcribedText);
      } finally {
        setIsProcessing(false);
      }
    },
    [date, onAddTask]
  );

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      onAddTask(manualInput.trim());
      setManualInput('');
      setShowManualInput(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 modal-overlay animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="glass rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] sm:max-h-[85vh] overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[var(--border-color)]">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold">
              {format(date, 'd MMMM yyyy', { locale: pl })}
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5 sm:mt-1 capitalize">
              {format(date, 'EEEE', { locale: pl })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors active:scale-95"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-80px)] sm:max-h-[60vh]">
          {/* Audio recorder */}
          <div className="mb-4 sm:mb-6 p-4 sm:p-6 rounded-xl bg-[var(--bg-tertiary)]">
            <AudioRecorder
              onTranscription={handleTranscription}
              isProcessing={isProcessing}
            />
          </div>

          {/* Manual input toggle */}
          {!showManualInput ? (
            <button
              onClick={() => setShowManualInput(true)}
              className="w-full mb-4 sm:mb-6 p-3 rounded-xl border border-dashed border-[var(--border-color)] 
                         text-[var(--text-muted)] hover:border-[var(--accent-primary)] 
                         hover:text-[var(--text-primary)] transition-colors flex items-center justify-center gap-2
                         active:scale-[0.98] text-sm sm:text-base"
            >
              <Plus className="w-4 h-4" />
              <span>Dodaj ręcznie</span>
            </button>
          ) : (
            <form onSubmit={handleManualSubmit} className="mb-4 sm:mb-6">
              <textarea
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="Opisz co zrobiłeś..."
                className="input-field min-h-[80px] sm:min-h-[100px] resize-none mb-3"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowManualInput(false)}
                  className="flex-1 py-2 px-4 rounded-xl bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] transition-colors text-sm sm:text-base active:scale-[0.98]"
                >
                  Anuluj
                </button>
                <button type="submit" className="flex-1 btn-primary active:scale-[0.98]">
                  Dodaj
                </button>
              </div>
            </form>
          )}

          {/* Task list */}
          <TaskList
            tasks={dayEntry?.tasks || []}
            onRemoveTask={onRemoveTask}
            onUpdateTask={onUpdateTask}
          />
        </div>
      </div>
    </div>
  );
}
