'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { isOnboardingCompleted } from '@/lib/onboarding';

export default function LandingPage() {
  const router = useRouter();
  const token = useAuthStore(s => s.token);

  useEffect(() => {
    useAuthStore.getState().loadFromStorage();
  }, []);

  useEffect(() => {
    const currentToken = useAuthStore.getState().token;
    if (currentToken) {
      if (isOnboardingCompleted()) {
        router.replace('/dashboard');
      } else {
        router.replace('/onboarding/step-1');
      }
    }
  }, [token, router]);

  if (token) return null;

  return (
    <div className="flex min-h-dvh flex-col bg-gradient-to-b from-[var(--color-primary)] via-[var(--color-primary-dark)] to-indigo-900">
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="mb-8">
          <img
            src="/brand/hor-logo-dark.svg"
            alt="Numa"
            className="h-10 w-auto mx-auto mb-6"
          />
        </div>

        <div className="w-48 h-48 mx-auto mb-8 relative">
          <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <circle cx="100" cy="100" r="90" fill="rgba(255,255,255,0.1)" />
            <rect x="50" y="120" width="20" height="40" rx="4" fill="rgba(255,255,255,0.6)" />
            <rect x="80" y="90" width="20" height="70" rx="4" fill="rgba(255,255,255,0.7)" />
            <rect x="110" y="70" width="20" height="90" rx="4" fill="rgba(255,255,255,0.8)" />
            <rect x="140" y="50" width="20" height="110" rx="4" fill="white" />
            <circle cx="60" cy="110" r="6" fill="rgba(255,255,255,0.5)" />
            <circle cx="90" cy="80" r="6" fill="rgba(255,255,255,0.6)" />
            <circle cx="120" cy="60" r="6" fill="rgba(255,255,255,0.7)" />
            <circle cx="150" cy="40" r="6" fill="white" />
            <line x1="60" y1="110" x2="90" y2="80" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
            <line x1="90" y1="80" x2="120" y2="60" stroke="rgba(255,255,255,0.5)" strokeWidth="2" />
            <line x1="120" y1="60" x2="150" y2="40" stroke="rgba(255,255,255,0.6)" strokeWidth="2" />
          </svg>
        </div>

        <h1 className="text-3xl font-extrabold text-white mb-3 tracking-tight">
          Tus finanzas, bajo control
        </h1>
        <p className="text-sm text-white/70 max-w-xs mx-auto leading-relaxed">
          Registra tus gastos, ingresos y mantén tus cuentas organizadas. Todo desde tu celular, incluso sin internet.
        </p>
      </div>

      <div className="px-6 pb-10 pt-4 space-y-3" style={{ paddingBottom: 'calc(2.5rem + env(safe-area-inset-bottom))' }}>
        <Link
          href="/register"
          className="flex items-center justify-center w-full h-12 rounded-xl bg-white text-[var(--color-primary-dark)] font-bold text-base hover:bg-white/90 active:scale-[0.98] transition-all shadow-lg"
        >
          Empezar
        </Link>
        <Link
          href="/login"
          className="flex items-center justify-center w-full h-12 rounded-xl border-2 border-white/30 text-white font-semibold text-base hover:bg-white/10 active:scale-[0.98] transition-all"
        >
          Ya tengo cuenta
        </Link>
      </div>
    </div>
  );
}
