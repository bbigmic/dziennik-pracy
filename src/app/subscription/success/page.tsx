'use client';

import Link from 'next/link';
import { CheckCircle, Home, Sparkles } from 'lucide-react';
import { useEffect } from 'react';
import confetti from 'canvas-confetti';

export default function SubscriptionSuccessPage() {
  useEffect(() => {
    // Celebracja confetti
    const end = Date.now() + 3 * 1000;
    const colors = ['#6366f1', '#818cf8', '#10b981'];

    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  }, []);

  return (
    <main className="min-h-screen bg-pattern flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center p-4 rounded-full bg-green-500/20 mb-6">
          <CheckCircle className="w-16 h-16 text-green-400" />
        </div>

        <h1 className="text-3xl font-bold mb-3">Dziękujemy!</h1>
        <p className="text-[var(--text-muted)] mb-8">
          Twoja subskrypcja została aktywowana. Teraz masz pełny dostęp do
          wszystkich funkcji Dziennika Pracy.
        </p>

        <div className="glass rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-center gap-2 text-[var(--accent-secondary)] mb-3">
            <Sparkles className="w-5 h-5" />
            <span className="font-medium">Odblokowane funkcje</span>
          </div>
          <ul className="text-sm text-[var(--text-muted)] space-y-2">
            <li>✓ Nieograniczone nagrania</li>
            <li>✓ Transkrypcja AI</li>
            <li>✓ Synchronizacja danych</li>
          </ul>
        </div>

        <Link href="/" className="btn-primary inline-flex items-center gap-2">
          <Home className="w-5 h-5" />
          Przejdź do aplikacji
        </Link>
      </div>
    </main>
  );
}

