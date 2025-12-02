'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Briefcase, Mail, Lock, User, UserPlus, Loader2, Eye, EyeOff, Gift, Check } from 'lucide-react';
import Image from 'next/image';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [marketingAccepted, setMarketingAccepted] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!termsAccepted) {
      setError('Musisz zaakceptować regulamin i politykę prywatności');
      return;
    }

    if (password !== confirmPassword) {
      setError('Hasła nie są identyczne');
      return;
    }

    if (password.length < 6) {
      setError('Hasło musi mieć co najmniej 6 znaków');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          password, 
          name,
          termsAccepted,
          marketingAccepted,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Wystąpił błąd podczas rejestracji');
        return;
      }

      // Automatyczne logowanie po rejestracji
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else {
        router.push('/');
        router.refresh();
      }
    } catch {
      setError('Wystąpił błąd podczas rejestracji');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-pattern flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center gap-3 mb-4">
            <div className="relative w-14 h-14 rounded-2xl overflow-hidden">
              <Image
                src="/icon-source.png"
                alt="Dziennik Pracy"
                fill
                className="object-cover"
              />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Dziennik Pracy</h1>
          </div>
          <p className="text-[var(--text-muted)]">Utwórz nowe konto</p>
        </div>

        {/* Trial banner */}
        <div className="glass rounded-xl p-4 mb-6 flex items-center gap-3 border border-[var(--accent-primary)]/30">
          <div className="p-2 rounded-lg bg-[var(--accent-primary)]/20">
            <Gift className="w-5 h-5 text-[var(--accent-secondary)]" />
          </div>
          <div>
            <p className="font-medium text-sm">7 dni darmowego trialu</p>
            <p className="text-xs text-[var(--text-muted)]">Potem tylko $7/miesiąc</p>
          </div>
        </div>

        {/* Form */}
        <div className="glass rounded-2xl p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2">
                Imię (opcjonalnie)
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field pl-12"
                  placeholder="Jan"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-12"
                  placeholder="twoj@email.pl"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Hasło
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-12 pr-12"
                  placeholder="Minimum 6 znaków"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                Potwierdź hasło
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-field pl-12"
                  placeholder="Powtórz hasło"
                  required
                />
              </div>
            </div>

            {/* Zgody */}
            <div className="space-y-3 pt-2">
              {/* Regulamin i Polityka prywatności - wymagane */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative flex-shrink-0 mt-0.5">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-5 h-5 rounded border-2 border-[var(--border-color)] bg-[var(--bg-tertiary)] peer-checked:bg-[var(--accent-primary)] peer-checked:border-[var(--accent-primary)] transition-all flex items-center justify-center">
                    {termsAccepted && <Check className="w-3 h-3 text-white" />}
                  </div>
                </div>
                <span className="text-sm text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
                  Akceptuję{' '}
                  <Link href="/regulamin" className="text-[var(--accent-secondary)] hover:underline">
                    Regulamin
                  </Link>{' '}
                  oraz{' '}
                  <Link href="/polityka-prywatnosci" className="text-[var(--accent-secondary)] hover:underline">
                    Politykę Prywatności
                  </Link>{' '}
                  <span className="text-red-400">*</span>
                </span>
              </label>

              {/* Marketing - opcjonalne */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative flex-shrink-0 mt-0.5">
                  <input
                    type="checkbox"
                    checked={marketingAccepted}
                    onChange={(e) => setMarketingAccepted(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-5 h-5 rounded border-2 border-[var(--border-color)] bg-[var(--bg-tertiary)] peer-checked:bg-[var(--accent-primary)] peer-checked:border-[var(--accent-primary)] transition-all flex items-center justify-center">
                    {marketingAccepted && <Check className="w-3 h-3 text-white" />}
                  </div>
                </div>
                <span className="text-sm text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
                  Chcę otrzymywać informacje o nowościach i promocjach
                </span>
              </label>

              <p className="text-xs text-[var(--text-muted)]">
                <span className="text-red-400">*</span> Pole wymagane
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading || !termsAccepted}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  Zarejestruj się
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-[var(--text-muted)]">Masz już konto? </span>
            <Link
              href="/login"
              className="text-[var(--accent-secondary)] hover:text-[var(--accent-primary)] font-medium transition-colors"
            >
              Zaloguj się
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

