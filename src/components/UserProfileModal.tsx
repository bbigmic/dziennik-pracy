'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { X, User, Lock, Eye, EyeOff, Loader2, Check, Bell, BellOff } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

interface UserProfileModalProps {
  onClose: () => void;
}

export default function UserProfileModal({ onClose }: UserProfileModalProps) {
  const { data: session } = useSession();
  const {
    isSupported: isPushSupported,
    isSubscribed,
    isLoading: isPushLoading,
    subscribe,
    unsubscribe,
  } = usePushNotifications();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pushError, setPushError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Wszystkie pola są wymagane');
      return;
    }

    if (newPassword.length < 6) {
      setError('Nowe hasło musi mieć co najmniej 6 znaków');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Nowe hasła nie są identyczne');
      return;
    }

    if (currentPassword === newPassword) {
      setError('Nowe hasło musi być inne niż obecne');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Wystąpił błąd podczas zmiany hasła');
        return;
      }

      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      // Ukryj komunikat sukcesu po 3 sekundach
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error changing password:', error);
      setError('Wystąpił błąd podczas zmiany hasła');
    } finally {
      setIsLoading(false);
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
            <h2 className="text-xl sm:text-2xl font-bold">Profil i ustawienia</h2>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5 sm:mt-1">
              Zarządzaj swoim kontem
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
          {/* User Info */}
          <div className="mb-6 p-4 sm:p-6 rounded-xl bg-[var(--bg-tertiary)]">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-[var(--accent-primary)]/20 flex items-center justify-center">
                <User className="w-6 h-6 sm:w-8 sm:h-8 text-[var(--accent-primary)]" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-semibold">
                  {session?.user?.name || 'Użytkownik'}
                </h3>
                <p className="text-sm sm:text-base text-[var(--text-muted)]">
                  {session?.user?.email}
                </p>
              </div>
            </div>
          </div>

          {/* Change Password Form */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Zmień hasło
            </h3>

            {error && (
              <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm flex items-center gap-2">
                <Check className="w-5 h-5" />
                Hasło zostało zmienione pomyślnie
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Current Password */}
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium mb-2">
                  Obecne hasło
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                  <input
                    id="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="input-field pl-12 pr-12"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium mb-2">
                  Nowe hasło
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                  <input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="input-field pl-12 pr-12"
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    {showNewPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Minimum 6 znaków
                </p>
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                  Potwierdź nowe hasło
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input-field pl-12 pr-12"
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    Zmień hasło
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Push Notifications */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Powiadomienia push
            </h3>

            {!isPushSupported && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm">
                Twoja przeglądarka nie obsługuje powiadomień push.
              </div>
            )}

            {isPushSupported && (
              <>
                <p className="text-sm text-[var(--text-muted)] mb-4">
                  Otrzymuj powiadomienia o deadline'ach zadań dzisiaj.
                </p>

                {pushError && (
                  <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                    {pushError}
                  </div>
                )}

                <button
                  onClick={async () => {
                    setPushError('');
                    if (isSubscribed) {
                      const success = await unsubscribe();
                      if (!success) {
                        setPushError('Nie udało się wyłączyć powiadomień');
                      }
                    } else {
                      const success = await subscribe();
                      if (!success) {
                        setPushError('Nie udało się włączyć powiadomień');
                      }
                    }
                  }}
                  disabled={isPushLoading}
                  className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 transition-colors ${
                    isSubscribed
                      ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
                      : 'bg-[var(--accent-primary)]/10 border-[var(--accent-primary)]/30 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/20'
                  }`}
                >
                  {isPushLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : isSubscribed ? (
                    <>
                      <BellOff className="w-5 h-5" />
                      Wyłącz powiadomienia
                    </>
                  ) : (
                    <>
                      <Bell className="w-5 h-5" />
                      Włącz powiadomienia
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

