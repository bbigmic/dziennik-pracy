'use client';

import { useState, useRef, useCallback } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';

interface AudioRecorderProps {
  onTranscription: (text: string) => void;
  isProcessing: boolean;
}

export default function AudioRecorder({
  onTranscription,
  isProcessing,
}: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

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
        await transcribeAudio(audioBlob);
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

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Transcription failed');
      }

      const data = await response.json();
      if (data.text) {
        onTranscription(data.text);
      }
    } catch (error) {
      console.error('Error transcribing audio:', error);
      alert('Błąd podczas transkrypcji. Sprawdź klucz API OpenAI.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const isLoading = isTranscribing || isProcessing;

  return (
    <div className="flex flex-col items-center gap-3 sm:gap-4">
      <button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isLoading}
        className={`
          relative w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center
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
          <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin" />
        ) : isRecording ? (
          <Square className="w-6 h-6 sm:w-8 sm:h-8 fill-current" />
        ) : (
          <Mic className="w-6 h-6 sm:w-8 sm:h-8" />
        )}
      </button>

      <p className="text-xs sm:text-sm text-[var(--text-muted)] text-center px-4">
        {isRecording
          ? 'Nagrywam... Kliknij, aby zatrzymać'
          : isTranscribing
          ? 'Transkrybuję nagranie...'
          : isProcessing
          ? 'Przetwarzam z AI...'
          : 'Kliknij, aby nagrać głosówkę'}
      </p>
    </div>
  );
}
