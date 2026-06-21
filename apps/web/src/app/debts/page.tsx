'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PlusIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Sheet } from '@/components/Sheet';
import { Skeleton } from '@/components/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import { SwipeDeleteAction } from '@/hooks/useSwipeToDelete';
import { useDebtsStore } from '@/store/debts';
import { formatCLP } from '@finance-app/utils';

export default function DebtsPage() {
  const { debts, isLoading, fetchDebts, createDebt, deleteDebt } = useDebtsStore();
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [rate, setRate] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => { fetchDebts(); }, [fetchDebts]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!name.trim()) { setFormError('El nombre es obligatorio'); return; }
    const initialAmount = Math.round(Number.parseFloat(amount) * 100);
    if (Number.isNaN(initialAmount) || initialAmount <= 0) { setFormError('Monto inválido'); return; }
    const interestRate = Number.parseFloat(rate);
    if (Number.isNaN(interestRate) || interestRate < 0) { setFormError('Tasa inválida'); return; }

    setFormLoading(true);
    await createDebt({ name: name.trim(), initialAmount, interestRate, startDate });
    setFormLoading(false);
    setCreateOpen(false);
    setName('');
    setAmount('');
    setRate('');
    setStartDate(new Date().toISOString().slice(0, 10));
  };

  return (
    <ProtectedRoute>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-[var(--color-text)]">Deudas</h2>
          <button onClick={() => setCreateOpen(true)}
            className="flex items-center justify-center w-10 h-10 rounded-lg text-[var(--color-primary)] hover:bg-[var(--color-surface-alt)] transition-colors">
            <PlusIcon className="w-5 h-5" />
          </button>
        </div>

        {isLoading ? (
          <Skeleton className="h-24 w-full" count={2} />
        ) : debts.length === 0 ? (
          <EmptyState icon={ExclamationTriangleIcon} title="Sin deudas" subtitle="Agrega tu primera deuda" />
        ) : (
          <div className="flex flex-col gap-3">
            {debts.map(debt => (
              <div key={debt.id} data-swipe-id={debt.id} className="relative overflow-hidden">
                <SwipeDeleteAction onDelete={() => deleteDebt(debt.id)} />
                <Link key={debt.id} href={`/debts/${debt.id}`}
                  className="relative z-10 block rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4 hover:bg-[var(--color-surface-alt)] transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-[var(--color-text)]">{debt.name}</span>
                    <span className="text-base font-semibold text-rose-500">{formatCLP(debt.initialAmount)}</span>
                  </div>
                  <div className="flex gap-3 mt-2 text-xs text-[var(--color-text-secondary)]">
                    <span>Tasa: {debt.interestRate}%</span>
                    <span>Desde: {debt.startDate}</span>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      <Sheet open={createOpen} onClose={() => setCreateOpen(false)} title="Nueva deuda">
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Nombre</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              className="w-full h-11 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
              placeholder="Ej: Crédito hipotecario" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Monto total ($)</label>
            <input type="number" inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)}
              className="w-full h-11 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
              placeholder="5000000" min="0" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Tasa de interés (%)</label>
            <input type="number" inputMode="decimal" value={rate} onChange={e => setRate(e.target.value)}
              className="w-full h-11 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
              placeholder="12.5" min="0" step="0.01" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Fecha de inicio</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              className="w-full h-11 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]" />
          </div>
          {formError && <p className="text-sm text-[var(--color-danger)]">{formError}</p>}
          <button type="submit" disabled={formLoading}
            className="w-full h-11 rounded-lg bg-[var(--color-primary)] text-white font-medium hover:bg-[var(--color-primary-dark)] disabled:opacity-50 transition-colors">
            {formLoading ? 'Guardando…' : 'Crear'}
          </button>
        </form>
      </Sheet>
    </ProtectedRoute>
  );
}
