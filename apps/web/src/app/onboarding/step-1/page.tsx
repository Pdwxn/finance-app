'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { setOnboardingCurrency } from '@/lib/onboarding';

const currencies = [
  { code: 'CLP', name: 'Peso chileno', symbol: 'CLP$' },
  { code: 'USD', name: 'Dólar', symbol: 'US$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'ARS', name: 'Peso argentino', symbol: 'AR$' },
  { code: 'COP', name: 'Peso colombiano', symbol: 'COL$' },
  { code: 'MXN', name: 'Peso mexicano', symbol: 'MX$' },
  { code: 'PEN', name: 'Sol peruano', symbol: 'S/' },
  { code: 'UYU', name: 'Peso uruguayo', symbol: 'UY$' },
];

export default function OnboardingStep1() {
  const router = useRouter();
  const [selected, setSelected] = useState('CLP');

  function handleNext() {
    setOnboardingCurrency(selected);
    router.push('/onboarding/step-2');
  }

  return (
    <div className="flex flex-col flex-1 px-6 pt-10 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
      <div className="flex items-center gap-2 mb-8">
        <div className="h-1.5 flex-1 rounded-full bg-[var(--color-primary)]" />
        <div className="h-1.5 flex-1 rounded-full bg-[var(--color-border)]" />
        <div className="h-1.5 flex-1 rounded-full bg-[var(--color-border)]" />
      </div>

      <h1 className="text-2xl font-bold text-[var(--color-text)] mb-2">
        ¿Qué moneda usas?
      </h1>
      <p className="text-sm text-[var(--color-text-secondary)] mb-8">
        Puedes cambiar esto después en la configuración.
      </p>

      <div className="flex-1 space-y-3 overflow-y-auto min-h-0">
        {currencies.map(c => (
          <button
            key={c.code}
            onClick={() => setSelected(c.code)}
            className={`w-full flex items-center gap-3 p-5 rounded-xl border-2 transition-all ${
              selected === c.code
                ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-text-secondary)]'
            }`}
          >
            <span className="text-lg font-bold text-[var(--color-text)] w-10">
              {c.symbol}
            </span>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-[var(--color-text)]">{c.name}</p>
              <p className="text-xs text-[var(--color-text-secondary)]">{c.code}</p>
            </div>
            {selected === c.code && (
              <div className="w-5 h-5 rounded-full bg-[var(--color-primary)] flex items-center justify-center">
                <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>

      <button
        onClick={handleNext}
        className="w-full h-12 rounded-xl bg-[var(--color-primary)] text-white font-bold text-base hover:bg-[var(--color-primary-dark)] active:scale-[0.98] transition-all mt-6 flex-shrink-0"
      >
        Siguiente
      </button>
    </div>
  );
}
