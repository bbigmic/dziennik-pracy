import Link from 'next/link';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';

export default function SubscriptionCancelPage() {
  return (
    <main className="min-h-screen bg-pattern flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center p-4 rounded-full bg-amber-500/20 mb-6">
          <XCircle className="w-16 h-16 text-amber-400" />
        </div>

        <h1 className="text-3xl font-bold mb-3">Płatność anulowana</h1>
        <p className="text-[var(--text-muted)] mb-8">
          Twoja płatność została anulowana. Jeśli to był błąd, możesz spróbować
          ponownie.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/subscription"
            className="btn-primary inline-flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            Spróbuj ponownie
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:border-[var(--accent-primary)] transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            Wróć do aplikacji
          </Link>
        </div>
      </div>
    </main>
  );
}

