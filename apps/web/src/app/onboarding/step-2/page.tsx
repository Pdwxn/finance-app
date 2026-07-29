'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getOnboardingCurrency } from '@/lib/onboarding';
import { useAccountsStore } from '@/store/accounts';
import { toCents } from '@finance-app/utils';
import type { Account } from '@finance-app/types';

const accountTypes: { value: Account['type']; label: string; icon: string }[] = [
  { value: 'checking', label: 'Corriente', icon: '🏦' },
  { value: 'savings', label: 'Ahorro', icon: '🐷' },
  { value: 'cash', label: 'Efectivo', icon: '💵' },
  { value: 'credit', label: 'Crédito', icon: '💳' },
  { value: 'investment', label: 'Inversión', icon: '📈' },
];

export default function OnboardingStep2() {
  const router = useRouter();
  const { createAccount, isLoading } = useAccountsStore();
  const currency = getOnboardingCurrency();

  const [name, setName] = useState('');
  const [type, setType] = useState<Account['type']>('checking');
  const [balanceInput, setBalanceInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('El nombre es obligatorio');
      return;
    }

    const balanceNumber = Number.parseFloat(balanceInput);
    if (Number.isNaN(balanceNumber) || balanceNumber < 0) {
      setError('El saldo debe ser un número válido');
      return;
    }

    await createAccount({
      name: name.trim(),
      type,
      currency,
      initialBalance: toCents(balanceNumber),
    });

    router.push('/onboarding/step-3');
  }

  function handleSkip() {
    router.push('/onboarding/step-3');
  }

  return (
    <div className="flex flex-col flex-1 px-6 pt-10 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
      <div className="flex items-center gap-2 mb-8">
        <div className="h-1.5 flex-1 rounded-full bg-[var(--color-primary)]" />
        <div className="h-1.5 flex-1 rounded-full bg-[var(--color-primary)]" />
        <div className="h-1.5 flex-1 rounded-full bg-[var(--color-border)]" />
      </div>

      <h1 className="text-2xl font-bold text-[var(--color-text)] mb-2">
        Crea tu primera cuenta
      </h1>
      <p className="text-sm text-[var(--color-text-secondary)] mb-6">
        Puedes agregar más cuentas después.
      </p>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
            Nombre
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full h-11 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] transition-colors"
            placeholder="Ej: Cuenta Rut"
            autoComplete="off"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
            Tipo
          </label>
          <div className="grid grid-cols-3 gap-2">
            {accountTypes.map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => setType(t.value)}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                  type === t.value
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                    : 'border-[var(--color-border)] bg-[var(--color-surface)]'
                }`}
              >
                <span className="text-xl">{t.icon}</span>
                <span className="text-xs font-semibold text-[var(--color-text)]">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="balance" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
            Saldo inicial ({currency})
          </label>
          <input
            id="balance"
            type="number"
            inputMode="decimal"
            value={balanceInput}
            onChange={e => setBalanceInput(e.target.value)}
            className="w-full h-11 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] transition-colors"
            placeholder="0"
            min="0"
            step="1"
          />
        </div>

        {error && (
          <p className="text-sm text-[var(--color-danger)]">{error}</p>
        )}

        <div className="flex-1" />

        <div className="space-y-3 mt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 rounded-xl bg-[var(--color-primary)] text-white font-bold text-base hover:bg-[var(--color-primary-dark)] active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {isLoading ? 'Creando...' : 'Crear cuenta'}
          </button>
          <button
            type="button"
            onClick={handleSkip}
            className="w-full h-12 rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] font-semibold text-sm hover:bg-[var(--color-surface-alt)] transition-colors"
          >
            Saltar por ahora
          </button>
        </div>
      </form>
    </div>
  );
}
