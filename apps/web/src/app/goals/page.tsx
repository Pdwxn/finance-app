'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PlusIcon, BoltIcon } from '@heroicons/react/24/outline';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Sheet } from '@/components/Sheet';
import { Skeleton } from '@/components/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import { SwipeDeleteAction } from '@/hooks/useSwipeToDelete';
import { useGoalsStore } from '@/store/goals';
import { formatCLP, toCents } from '@finance-app/utils';

export default function GoalsPage() {
  const { goals, isLoading, fetchGoals, createGoal, deleteGoal } = useGoalsStore();
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => { fetchGoals(); }, [fetchGoals]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!name.trim()) { setFormError('El nombre es obligatorio'); return; }
    const targetAmount = toCents(Number.parseFloat(amount));
    if (Number.isNaN(targetAmount) || targetAmount <= 0) { setFormError('Monto inválido'); return; }
    if (!targetDate) { setFormError('La fecha objetivo es obligatoria'); return; }

    setFormLoading(true);
    await createGoal({ name: name.trim(), targetAmount, targetDate });
    setFormLoading(false);
    setCreateOpen(false);
    setName('');
    setAmount('');
    setTargetDate('');
  };

  return (
    <ProtectedRoute>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-[var(--color-text)]">Metas</h2>
          <button onClick={() => setCreateOpen(true)}
            className="flex items-center justify-center w-10 h-10 rounded-lg text-[var(--color-primary)] hover:bg-[var(--color-surface-alt)] transition-colors">
            <PlusIcon className="w-5 h-5" />
          </button>
        </div>

        {isLoading ? (
          <Skeleton className="h-24 w-full" count={2} />
        ) : goals.length === 0 ? (
          <EmptyState icon={BoltIcon} title="Sin metas" subtitle="Crea tu primera meta de ahorro" />
        ) : (
          <div className="flex flex-col gap-3">
            {goals.map(goal => (
              <div key={goal.id} data-swipe-id={goal.id} className="relative overflow-hidden">
                <SwipeDeleteAction onDelete={() => deleteGoal(goal.id)} />
                <Link key={goal.id} href={`/goals/${goal.id}`}
                  className="relative z-10 block rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4 hover:bg-[var(--color-surface-alt)] transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-[var(--color-text)]">{goal.name}</span>
                    <span className="text-base font-semibold text-[var(--color-primary)]">{formatCLP(goal.targetAmount)}</span>
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-1">Meta: {goal.targetDate}</p>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      <Sheet open={createOpen} onClose={() => setCreateOpen(false)} title="Nueva meta">
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Nombre</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              className="w-full h-11 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
              placeholder="Ej: Viaje a Europa" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Monto objetivo ($)</label>
            <input type="number" inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)}
              className="w-full h-11 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
              placeholder="2000000" min="0" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Fecha objetivo</label>
            <input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)}
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
