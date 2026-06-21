'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Sheet } from '@/components/Sheet';
import { useGoalsStore } from '@/store/goals';
import { formatCLP } from '@finance-app/utils';

export default function GoalsPage() {
  const { goals, isLoading, fetchGoals, createGoal } = useGoalsStore();
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
    const targetAmount = Math.round(Number.parseFloat(amount) * 100);
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
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-3">{[1, 2].map(i => <div key={i} className="h-24 rounded-xl bg-[var(--color-surface)] animate-pulse" />)}</div>
        ) : goals.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-16 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--color-text-secondary)] mb-4">
              <path d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <p className="text-[var(--color-text-secondary)] font-medium">Sin metas</p>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">Crea tu primera meta de ahorro</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {goals.map(goal => (
              <Link key={goal.id} href={`/goals/${goal.id}`}
                className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4 hover:bg-[var(--color-surface-alt)] transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-[var(--color-text)]">{goal.name}</span>
                  <span className="text-base font-semibold text-[var(--color-primary)]">{formatCLP(goal.targetAmount)}</span>
                </div>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1">Meta: {goal.targetDate}</p>
              </Link>
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
