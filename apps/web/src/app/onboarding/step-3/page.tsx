'use client';

import { useRouter } from 'next/navigation';
import { completeOnboarding } from '@/lib/onboarding';

export default function OnboardingStep3() {
  const router = useRouter();

  function handleFinish() {
    completeOnboarding();
    router.push('/dashboard');
  }

  return (
    <div className="flex flex-col flex-1 items-center justify-center px-6 text-center">
      <div className="mb-8">
        <div className="w-24 h-24 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center mx-auto">
          <svg className="w-12 h-12 text-[var(--color-primary)]" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2.5" />
            <path d="M15 24l6 6 12-12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      <h1 className="text-2xl font-bold text-[var(--color-text)] mb-3">
        ¡Todo listo!
      </h1>
      <p className="text-sm text-[var(--color-text-secondary)] max-w-xs mx-auto leading-relaxed mb-10">
        Ya puedes empezar a registrar tus movimientos y mantener tus finanzas organizadas.
      </p>

      <button
        onClick={handleFinish}
        className="w-full h-12 rounded-xl bg-[var(--color-primary)] text-white font-bold text-base hover:bg-[var(--color-primary-dark)] active:scale-[0.98] transition-all"
      >
        Ir al dashboard
      </button>
    </div>
  );
}
