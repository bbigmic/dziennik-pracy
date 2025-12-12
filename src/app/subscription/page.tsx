'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Crown, Check, Loader2, ArrowLeft, Zap, Clock, Shield, Gift, X } from 'lucide-react';
import Link from 'next/link';

export default function SubscriptionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [subscriptionInfo, setSubscriptionInfo] = useState<{
    isActive: boolean;
    isTrialing: boolean;
    trialEndsAt: string | null;
    subscriptionEndsAt: string | null;
  } | null>(null);
  const [activationCode, setActivationCode] = useState('');
  const [isActivating, setIsActivating] = useState(false);
  const [activationError, setActivationError] = useState('');
  const [activationSuccess, setActivationSuccess] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchSubscriptionInfo();
    }
  }, [session]);

  const fetchSubscriptionInfo = async () => {
    try {
      const res = await fetch('/api/subscription/status');
      if (res.ok) {
        const data = await res.json();
        setSubscriptionInfo(data);
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    }
  };

  const handleSubscribe = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error opening portal:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActivateCode = async () => {
    if (!activationCode.trim()) {
      setActivationError('Wpisz kod aktywacyjny');
      return;
    }

    setIsActivating(true);
    setActivationError('');
    setActivationSuccess(false);

    try {
      const res = await fetch('/api/activation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: activationCode.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setActivationError(data.error || 'Wystąpił błąd podczas aktywacji');
        return;
      }

      setActivationSuccess(true);
      setActivationCode('');
      // Odśwież informacje o subskrypcji
      await fetchSubscriptionInfo();
      
      // Ukryj komunikat sukcesu po 5 sekundach
      setTimeout(() => {
        setActivationSuccess(false);
      }, 5000);
    } catch (error) {
      console.error('Error activating code:', error);
      setActivationError('Wystąpił błąd podczas aktywacji kodu');
    } finally {
      setIsActivating(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-pattern flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-primary)]" />
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <main className="min-h-screen bg-pattern py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Wróć do aplikacji
        </Link>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 mb-4">
            <Crown className="w-8 h-8" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">Subskrypcja Premium</h1>
          <p className="text-[var(--text-muted)] max-w-md mx-auto">
            Uzyskaj pełny dostęp do wszystkich funkcji Dziennika Pracy
          </p>
        </div>

        {/* Current status */}
        {subscriptionInfo && (
          <div className="glass rounded-2xl p-6 mb-8">
            <h3 className="font-semibold mb-3">Status konta</h3>
            {subscriptionInfo.isTrialing ? (
              <div className="flex items-center gap-3 text-amber-400">
                <Clock className="w-5 h-5" />
                <span>
                  Trial aktywny do{' '}
                  <strong>{formatDate(subscriptionInfo.trialEndsAt!)}</strong>
                </span>
              </div>
            ) : subscriptionInfo.subscriptionEndsAt ? (
              <div className="flex items-center gap-3 text-green-400">
                <Shield className="w-5 h-5" />
                <span>
                  Subskrypcja aktywna do{' '}
                  <strong>{formatDate(subscriptionInfo.subscriptionEndsAt)}</strong>
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-3 text-red-400">
                <Zap className="w-5 h-5" />
                <span>Brak aktywnej subskrypcji</span>
              </div>
            )}
          </div>
        )}

        {/* Activation Code Section */}
        {!subscriptionInfo?.subscriptionEndsAt && (
          <div className="glass rounded-2xl p-6 mb-8 max-w-md mx-auto border border-purple-500/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-purple-500/20">
                <Gift className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold">Masz kod aktywacyjny?</h3>
                <p className="text-sm text-[var(--text-muted)]">
                  Aktywuj darmową subskrypcję na miesiąc
                </p>
              </div>
            </div>

            {activationError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center justify-between">
                <span>{activationError}</span>
                <button
                  onClick={() => setActivationError('')}
                  className="p-1 hover:bg-red-500/20 rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {activationSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>Kod aktywacyjny został zastosowany pomyślnie! Subskrypcja aktywna na miesiąc.</span>
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                value={activationCode}
                onChange={(e) => setActivationCode(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleActivateCode();
                  }
                }}
                placeholder="Wpisz kod aktywacyjny"
                className="flex-1 input-field"
                disabled={isActivating}
              />
              <button
                onClick={handleActivateCode}
                disabled={isActivating || !activationCode.trim()}
                className="px-6 py-3 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-400 hover:bg-purple-500/30 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isActivating ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Gift className="w-5 h-5" />
                    Aktywuj
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Pricing card */}
        <div className="glass rounded-2xl p-8 border border-[var(--accent-primary)]/30 max-w-md mx-auto">
          <div className="text-center mb-6">
            <div className="text-5xl font-bold mb-2">
              8 zł
              <span className="text-lg font-normal text-[var(--text-muted)]">/tydzień</span>
            </div>
            <p className="text-[var(--text-muted)]">Płatność tygodniowa</p>
          </div>

          <ul className="space-y-4 mb-8">
            <li className="flex items-center gap-3">
              <div className="p-1 rounded-full bg-green-500/20">
                <Check className="w-4 h-4 text-green-400" />
              </div>
              <span>Nieograniczone nagrania głosowe</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="p-1 rounded-full bg-green-500/20">
                <Check className="w-4 h-4 text-green-400" />
              </div>
              <span>Transkrypcja AI</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="p-1 rounded-full bg-green-500/20">
                <Check className="w-4 h-4 text-green-400" />
              </div>
              <span>Synchronizacja między urządzeniami</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="p-1 rounded-full bg-green-500/20">
                <Check className="w-4 h-4 text-green-400" />
              </div>
              <span>Nieograniczona historia</span>
            </li>
          </ul>

          {subscriptionInfo?.subscriptionEndsAt ? (
            <button
              onClick={handleManageSubscription}
              disabled={isLoading}
              className="w-full py-3 px-6 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] hover:border-[var(--accent-primary)] font-semibold transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Zarządzaj subskrypcją'
              )}
            </button>
          ) : (
            <button
              onClick={handleSubscribe}
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Crown className="w-5 h-5" />
                  Subskrybuj teraz
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}

