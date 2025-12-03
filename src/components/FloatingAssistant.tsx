'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { Mic, Square, Loader2, X } from 'lucide-react';

interface FloatingAssistantProps {
  onAddTask: (task: {
    title: string;
    description?: string;
    category: 'todo';
    priority: 'low' | 'medium' | 'high';
    deadline?: string;
    deadlineTime?: string;
  }) => void;
}

const TOOLTIP_STORAGE_KEY = 'floating-assistant-tooltip-dismissed';
const AUTO_RECORD_STORAGE_KEY = 'floating-assistant-auto-record';

export default function FloatingAssistant({ onAddTask }: FloatingAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [autoRecord, setAutoRecord] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const tooltipTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasAutoRecordedRef = useRef(false);

  // Załaduj preferencję auto-record z localStorage
  useEffect(() => {
    const saved = localStorage.getItem(AUTO_RECORD_STORAGE_KEY);
    if (saved === 'true') {
      setAutoRecord(true);
    }
  }, []);

  // Sprawdź czy tooltip był już wyłączony
  useEffect(() => {
    const dismissed = localStorage.getItem(TOOLTIP_STORAGE_KEY);
    if (dismissed === 'true') {
      return; // Nie pokazuj tooltipu
    }

    // Pokaż tooltip po 3 sekundach
    tooltipTimerRef.current = setTimeout(() => {
      setShowTooltip(true);
    }, 3000);

    return () => {
      if (tooltipTimerRef.current) {
        clearTimeout(tooltipTimerRef.current);
      }
    };
  }, []);

  // Ukryj tooltip gdy panel jest otwarty
  useEffect(() => {
    if (isOpen && showTooltip) {
      setShowTooltip(false);
    }
  }, [isOpen, showTooltip]);

  // Automatyczne rozpoczęcie nagrywania gdy panel się otwiera
  useEffect(() => {
    if (isOpen && autoRecord && !hasAutoRecordedRef.current && !isRecording && !isTranscribing && !isProcessing) {
      hasAutoRecordedRef.current = true;
      // Małe opóźnienie żeby panel się w pełni otworzył
      const timer = setTimeout(() => {
        startRecording();
      }, 300);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, autoRecord, isRecording, isTranscribing, isProcessing]);

  // Reset flagi gdy panel się zamyka
  useEffect(() => {
    if (!isOpen) {
      hasAutoRecordedRef.current = false;
    }
  }, [isOpen]);

  const handleDismissTooltip = () => {
    setShowTooltip(false);
    if (dontShowAgain) {
      localStorage.setItem(TOOLTIP_STORAGE_KEY, 'true');
    }
  };

  const handleAutoRecordChange = (checked: boolean) => {
    setAutoRecord(checked);
    localStorage.setItem(AUTO_RECORD_STORAGE_KEY, checked ? 'true' : 'false');
  };

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach((track) => track.stop());
        await transcribeAndProcess(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Nie można uzyskać dostępu do mikrofonu. Sprawdź uprawnienia.');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const transcribeAndProcess = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    try {
      // Transkrypcja
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const transcribeResponse = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!transcribeResponse.ok) {
        throw new Error('Transcription failed');
      }

      const transcribeData = await transcribeResponse.json();
      
      if (!transcribeData.text) {
        throw new Error('No transcription text');
      }

      setIsTranscribing(false);
      setIsProcessing(true);

      // Przetwarzanie przez AI - specjalny prompt dla zadań
      const processResponse = await fetch('/api/process-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: transcribeData.text,
        }),
      });

      if (!processResponse.ok) {
        throw new Error('Processing failed');
      }

      const processData = await processResponse.json();
      
      if (processData.task) {
        onAddTask({
          title: processData.task.title,
          description: processData.task.description,
          category: 'todo',
          priority: processData.task.priority || 'medium',
          deadline: processData.task.deadline || undefined,
          deadlineTime: processData.task.deadlineTime || undefined,
        });
        setIsOpen(false);
      } else {
        // Fallback - użyj surowego tekstu jako tytuł
        onAddTask({
          title: transcribeData.text,
          category: 'todo',
          priority: 'medium',
        });
        setIsOpen(false);
      }
    } catch (error) {
      console.error('Error processing voice input:', error);
      alert('Błąd podczas przetwarzania głosówki. Spróbuj ponownie.');
    } finally {
      setIsTranscribing(false);
      setIsProcessing(false);
    }
  };

  const isLoading = isTranscribing || isProcessing;

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={() => setIsOpen(true)}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full 
                       bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)]
                       shadow-2xl pulse-glow hover:scale-110 active:scale-95
                       flex items-center justify-center transition-all duration-300
                       border-2 border-white/20 relative overflow-hidden"
            aria-label="Otwórz asystenta głosowego"
          >
            <Image
              src="/feliz-agent.png"
              alt="Asystent głosowy"
              fill
              className="object-cover rounded-full"
            />
          </button>

          {/* Tooltip */}
          {showTooltip && (
            <div className="absolute bottom-full right-0 mb-3 w-72 sm:w-80 animate-slide-up">
              <div className="glass rounded-xl p-4 shadow-2xl border border-[var(--border-color)]">
                <div className="flex items-start gap-3">
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src="/feliz-agent.png"
                      alt="Feliz Agent"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--text-primary)] mb-3">
                      Hej, jestem Feliz Agent, możesz wysłać mi głosówkę, a ja dodam zadanie za Ciebie.
                    </p>
                    <div className="flex items-center gap-2 mb-3">
                      <input
                        type="checkbox"
                        id="dont-show-again"
                        checked={dontShowAgain}
                        onChange={(e) => setDontShowAgain(e.target.checked)}
                        className="w-4 h-4 rounded border-[var(--border-color)] bg-[var(--bg-tertiary)] 
                                   text-[var(--accent-primary)] focus:ring-[var(--accent-primary)] 
                                   focus:ring-2 cursor-pointer"
                      />
                      <label
                        htmlFor="dont-show-again"
                        className="text-xs text-[var(--text-muted)] cursor-pointer select-none"
                      >
                        Nie pokazuj ponownie
                      </label>
                    </div>
                    <button
                      onClick={handleDismissTooltip}
                      className="w-full py-2 px-3 rounded-lg bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] 
                               text-white text-sm font-medium transition-colors active:scale-[0.98]"
                    >
                      Rozumiem
                    </button>
                  </div>
                  <button
                    onClick={handleDismissTooltip}
                    className="p-1 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors flex-shrink-0"
                    aria-label="Zamknij"
                  >
                    <X className="w-4 h-4 text-[var(--text-muted)]" />
                  </button>
                </div>
                {/* Arrow pointing to button */}
                <div className="absolute -bottom-2 right-8 w-4 h-4 bg-[var(--bg-secondary)] border-r border-b border-[var(--border-color)] transform rotate-45" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Assistant Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-40 w-80 sm:w-96 animate-slide-up">
          <div className="glass rounded-2xl p-6 shadow-2xl border border-[var(--border-color)]">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="relative w-10 h-10 rounded-lg overflow-hidden">
                  <Image
                    src="/feliz-agent.png"
                    alt="Asystent głosowy"
                    fill
                    className="object-cover"
                  />
                </div>
                <h3 className="font-semibold text-lg">Asystent głosowy</h3>
              </div>
              <button
                onClick={() => {
                  setIsOpen(false);
                  if (isRecording) stopRecording();
                }}
                className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
                aria-label="Zamknij"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Recording Button */}
            <div className="flex flex-col items-center gap-4">
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isLoading}
                className={`
                  relative w-20 h-20 rounded-full flex items-center justify-center
                  transition-all duration-300 active:scale-95
                  ${
                    isRecording
                      ? 'bg-[var(--danger)] recording-pulse'
                      : isLoading
                      ? 'bg-[var(--bg-tertiary)] cursor-not-allowed'
                      : 'bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] pulse-glow hover:scale-105'
                  }
                `}
              >
                {isLoading ? (
                  <Loader2 className="w-10 h-10 animate-spin text-white" />
                ) : isRecording ? (
                  <Square className="w-10 h-10 fill-current text-white" />
                ) : (
                  <Mic className="w-10 h-10 text-white" />
                )}
              </button>

              <div className="w-full">
                <p className="text-sm text-[var(--text-muted)] text-center mb-3">
                  {isRecording
                    ? 'Nagrywam... Kliknij, aby zatrzymać'
                    : isTranscribing
                    ? 'Transkrybuję nagranie...'
                    : isProcessing
                    ? 'Przetwarzam z AI...'
                    : 'Powiedz zadanie do wykonania'}
                </p>
                
                {!isLoading && (
                  <div className="flex items-center justify-center gap-2">
                    <input
                      type="checkbox"
                      id="auto-record"
                      checked={autoRecord}
                      onChange={(e) => handleAutoRecordChange(e.target.checked)}
                      className="w-4 h-4 rounded border-[var(--border-color)] bg-[var(--bg-tertiary)] 
                                 text-[var(--accent-primary)] focus:ring-[var(--accent-primary)] 
                                 focus:ring-2 cursor-pointer"
                    />
                    <label
                      htmlFor="auto-record"
                      className="text-xs text-[var(--text-muted)] cursor-pointer select-none"
                    >
                      Nagrywaj od razu po otwarciu asystenta
                    </label>
                  </div>
                )}
              </div>

              {isRecording && (
                <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                  <div className="w-2 h-2 rounded-full bg-[var(--danger)] animate-pulse" />
                  <span>Nagrywanie...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
