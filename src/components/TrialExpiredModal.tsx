'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Crown, Lock, Loader2, AlertCircle } from 'lucide-react';

interface TrialExpiredModalProps {
  onClose?: () => void;
}

export default function TrialExpiredModal({ onClose }: TrialExpiredModalProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('Brak URL checkout');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      setIsLoading(false);
    }
  };

  const handleGoToSubscription = () => {
    router.push('/subscription');
    onClose?.();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) onClose();
      }}
    >
      <div className="glass rounded-2xl w-full max-w-md overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="relative p-6 sm:p-8 bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-b border-amber-500/30">
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-xl hover:bg-black/10 transition-colors active:scale-95"
            >
              <X className="w-5 h-5 text-[var(--text-muted)]" />
            </button>
          )}
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-500/30 flex items-center justify-center">
              <Lock className="w-8 h-8 text-amber-400" />
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-2">
            Trial wygasł
          </h2>
          <p className="text-sm sm:text-base text-[var(--text-muted)] text-center">
            Twój 7-dniowy okres próbny dobiegł końca
          </p>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8">
          <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-amber-300 font-medium mb-1">
                  Aby kontynuować korzystanie z aplikacji
                </p>
                <p className="text-xs text-amber-400/80">
                  Wykup subskrypcję, aby odblokować wszystkie funkcje: dodawanie zadań, nagrywanie głosowe, przetwarzanie AI i wiele więcej.
                </p>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="mb-6 space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-6 h-6 rounded-full bg-[var(--accent-primary)]/20 flex items-center justify-center flex-shrink-0">
                <Crown className="w-4 h-4 text-[var(--accent-primary)]" />
              </div>
              <span>Nieograniczone dodawanie zadań</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-6 h-6 rounded-full bg-[var(--accent-primary)]/20 flex items-center justify-center flex-shrink-0">
                <Crown className="w-4 h-4 text-[var(--accent-primary)]" />
              </div>
              <span>Nagrywanie głosowe z transkrypcją</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-6 h-6 rounded-full bg-[var(--accent-primary)]/20 flex items-center justify-center flex-shrink-0">
                <Crown className="w-4 h-4 text-[var(--accent-primary)]" />
              </div>
              <span>Przetwarzanie AI i formatowanie</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-6 h-6 rounded-full bg-[var(--accent-primary)]/20 flex items-center justify-center flex-shrink-0">
                <Crown className="w-4 h-4 text-[var(--accent-primary)]" />
              </div>
              <span>Wszystkie funkcje premium</span>
            </div>
          </div>

          {/* Pricing */}
          <div className="mb-6 p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
            <div className="text-center">
              <p className="text-3xl font-bold text-[var(--accent-primary)] mb-1">
                8 zł
              </p>
              <p className="text-sm text-[var(--text-muted)]">
                za tydzień
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleSubscribe}
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base font-semibold"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Przekierowywanie...
                </>
              ) : (
                <>
                  <Crown className="w-5 h-5" />
                  Wykup subskrypcję teraz
                </>
              )}
            </button>
            <button
              onClick={handleGoToSubscription}
              className="w-full py-3 px-4 rounded-xl border-2 border-[var(--border-color)] hover:border-[var(--accent-primary)]/50 hover:bg-[var(--bg-tertiary)] transition-colors text-sm font-medium"
            >
              Zobacz szczegóły subskrypcji
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

