'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Crown, Check, Loader2, ArrowLeft, Zap, Clock, Shield } from 'lucide-react';
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

        {/* Pricing card */}
        <div className="glass rounded-2xl p-8 border border-[var(--accent-primary)]/30 max-w-md mx-auto">
          <div className="text-center mb-6">
            <div className="text-5xl font-bold mb-2">
              $7
              <span className="text-lg font-normal text-[var(--text-muted)]">/miesiąc</span>
            </div>
            <p className="text-[var(--text-muted)]">Płatność miesięczna</p>
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
            <li className="flex items-center gap-3">
              <div className="p-1 rounded-full bg-green-500/20">
                <Check className="w-4 h-4 text-green-400" />
              </div>
              <span>Priorytetowe wsparcie</span>
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

