'use client';

import { useState } from 'react';
import { fromCents, toCents } from '@finance-app/utils';
import type { Account } from '@finance-app/types';

const accountTypes: { value: Account['type']; label: string }[] = [
  { value: 'cash', label: 'Efectivo' },
  { value: 'checking', label: 'Corriente' },
  { value: 'savings', label: 'Ahorro' },
  { value: 'investment', label: 'Inversión' },
  { value: 'credit', label: 'Crédito' },
];

interface AccountFormData {
  name: string;
  type: Account['type'];
  currency: string;
  balanceInput: string;
}

interface AccountFormProps {
  initial?: Account;
  onSubmit: (data: {
    name: string;
    type: Account['type'];
    currency: string;
    initialBalance: number;
  }) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

export function AccountForm({ initial, onSubmit, onCancel, isLoading }: AccountFormProps) {
  const [data, setData] = useState<AccountFormData>({
    name: initial?.name ?? '',
    type: initial?.type ?? 'checking',
    currency: initial?.currency ?? 'CLP',
    balanceInput: initial ? String(fromCents(initial.initialBalance)) : '',
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!data.name.trim()) {
      setError('El nombre es obligatorio');
      return;
    }

    const balanceNumber = Number.parseFloat(data.balanceInput);
    if (Number.isNaN(balanceNumber) || balanceNumber < 0) {
      setError('El saldo debe ser un número válido');
      return;
    }

    await onSubmit({
      name: data.name.trim(),
      type: data.type,
      currency: data.currency.toUpperCase(),
      initialBalance: toCents(balanceNumber),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
          Nombre
        </label>
        <input
          id="name"
          type="text"
          value={data.name}
          onChange={e => setData(prev => ({ ...prev, name: e.target.value }))}
          className="w-full h-11 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] transition-colors"
          placeholder="Ej: Cuenta Rut"
          autoComplete="off"
        />
      </div>

      <div>
        <label htmlFor="type" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
          Tipo
        </label>
        <select
          id="type"
          value={data.type}
          onChange={e => setData(prev => ({ ...prev, type: e.target.value as Account['type'] }))}
          className="w-full h-11 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] transition-colors"
        >
          {accountTypes.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="currency" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
          Moneda
        </label>
        <input
          id="currency"
          type="text"
          value={data.currency}
          onChange={e => setData(prev => ({ ...prev, currency: e.target.value }))}
          className="w-full h-11 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] transition-colors"
          placeholder="CLP"
          autoComplete="off"
        />
      </div>

      <div>
        <label htmlFor="balance" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
          Saldo inicial
        </label>
        <input
          id="balance"
          type="number"
          inputMode="decimal"
          value={data.balanceInput}
          onChange={e => setData(prev => ({ ...prev, balanceInput: e.target.value }))}
          className="w-full h-11 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] transition-colors"
          placeholder="0"
          min="0"
          step="1"
        />
      </div>

      {error && (
        <p className="text-sm text-[var(--color-danger)]">{error}</p>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 h-11 rounded-lg border border-[var(--color-border)] text-[var(--color-text)] font-medium hover:bg-[var(--color-surface-alt)] transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 h-11 rounded-lg bg-[var(--color-primary)] text-white font-medium hover:bg-[var(--color-primary-dark)] disabled:opacity-50 transition-colors"
        >
          {isLoading ? 'Guardando…' : initial ? 'Actualizar' : 'Crear'}
        </button>
      </div>
    </form>
  );
}
