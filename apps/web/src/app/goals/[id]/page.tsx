'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import { Skeleton } from '@/components/Skeleton';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Sheet } from '@/components/Sheet';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useGoalsStore } from '@/store/goals';
import { useGoalContributionsStore } from '@/store/goal-contributions';
import { useAccountsStore } from '@/store/accounts';
import { useExpensesStore } from '@/store/expenses';
import { useIncomesStore } from '@/store/incomes';
import { useTransfersStore } from '@/store/transfers';
import { formatCLP, toCents } from '@finance-app/utils';

export default function GoalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { goals, fetchGoals, deleteGoal } = useGoalsStore();
  const { contributions, fetchContributions, createContribution } = useGoalContributionsStore();
  const { accounts, fetchAccounts } = useAccountsStore();
  const { expenses } = useExpensesStore();
  const { incomes } = useIncomesStore();
  const { transfers } = useTransfersStore();

  const [contributeOpen, setContributeOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const goal = goals.find(g => g.id === id);

  const totalSaved = useMemo(
    () => contributions.reduce((s, c) => s + c.amount, 0),
    [contributions]
  );

  const progressPct = goal && goal.targetAmount > 0
    ? Math.min(100, Math.round((totalSaved / goal.targetAmount) * 100))
    : 0;

  useEffect(() => {
    fetchGoals();
    fetchContributions(id);
    fetchAccounts();
  }, [fetchGoals, fetchContributions, fetchAccounts, id]);

  const handleDelete = async () => {
    setFormLoading(true);
    await deleteGoal(id);
    setFormLoading(false);
    router.push('/goals');
  };

  const [contributeAccountId, setContributeAccountId] = useState('');
  const [contributeAmount, setContributeAmount] = useState('');
  const [contributeDate, setContributeDate] = useState(new Date().toISOString().slice(0, 10));

  const handleAddContribution = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const parsed = Number.parseFloat(contributeAmount);
    if (Number.isNaN(parsed) || parsed <= 0) { setFormError('Monto inválido'); return; }
    if (!contributeAccountId) { setFormError('Selecciona una cuenta'); return; }

    const amount = toCents(parsed);

    const account = accounts.find(a => a.id === contributeAccountId);
    if (!account) { setFormError('Cuenta no encontrada'); return; }

    const incomeSum = incomes
      .filter(i => i.accountId === contributeAccountId)
      .reduce((s, i) => s + i.amount, 0);
    const expenseSum = expenses
      .filter(e => e.accountId === contributeAccountId)
      .reduce((s, e) => s + e.amount, 0);
    const transferOut = transfers
      .filter(t => t.fromAccountId === contributeAccountId)
      .reduce((s, t) => s + t.amount, 0);
    const transferIn = transfers
      .filter(t => t.toAccountId === contributeAccountId)
      .reduce((s, t) => s + t.amount, 0);

    const balance = account.initialBalance + incomeSum - expenseSum - transferOut + transferIn;

    if (balance < amount) {
      setFormError(`Saldo insuficiente. Disponible: ${formatCLP(balance)}`);
      return;
    }

    setFormLoading(true);
    await createContribution({
      goalId: id,
      accountId: contributeAccountId,
      amount,
      contributionDate: contributeDate,
    });
    setFormLoading(false);
    setFormError(null);
    setContributeOpen(false);
    setContributeAccountId('');
    setContributeAmount('');
    setContributeDate(new Date().toISOString().slice(0, 10));
  };

  const sortedContributions = useMemo(
    () => [...contributions].sort((a, b) => b.contributionDate.localeCompare(a.contributionDate)),
    [contributions]
  );

  if (!goal) {
    return (
      <ProtectedRoute>
        <div className="p-4">
          <p className="text-[var(--color-text-secondary)]">Cargando…</p>
          <Skeleton className="h-40 w-full mt-4" />
        </div>
      </ProtectedRoute>
    );
  }

  const remaining = Math.max(0, goal.targetAmount - totalSaved);

  return (
    <ProtectedRoute>
      <div className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => router.back()} className="flex items-center justify-center w-10 h-10 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)] transition-colors">
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-semibold text-[var(--color-text)]">{goal.name}</h2>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 p-5 text-white mb-4">
          <p className="text-sm font-medium opacity-80">Meta de ahorro</p>
          <p className="text-3xl font-bold mt-1">{formatCLP(goal.targetAmount)}</p>
          <p className="text-xs opacity-80 mt-1">Fecha objetivo: {goal.targetDate}</p>
          <div className="mt-4 pt-4 border-t border-white/20">
            <div className="flex justify-between text-sm">
              <span>Ahorrado</span>
              <span className="font-semibold">{formatCLP(totalSaved)}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span>Faltante</span>
              <span className="font-semibold">{formatCLP(remaining)}</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-xs mb-1">
              <span>Progreso</span>
              <span>{progressPct}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/20 overflow-hidden">
              <div className="h-full rounded-full bg-white transition-all" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <button onClick={() => setContributeOpen(true)}
            className="flex-1 h-10 rounded-lg bg-[var(--color-primary)] text-white text-sm font-medium hover:bg-[var(--color-primary-dark)] transition-colors">
            + Aportar
          </button>
        </div>

        <button onClick={() => setDeleteOpen(true)}
          className="w-full h-10 rounded-lg border border-[var(--color-danger)] text-[var(--color-danger)] text-sm font-medium hover:bg-[var(--color-danger)] hover:text-white transition-colors mb-4">
          Eliminar meta
        </button>

        {sortedContributions.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-text)] mb-2">Aportes</h3>
            <div className="flex flex-col gap-2">
              {sortedContributions.map(c => (
                <div key={c.id} className="flex items-center justify-between rounded-xl bg-[var(--color-surface)] p-3 border border-[var(--color-border)]">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-[var(--color-text-secondary)]">{c.contributionDate}</p>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      {accounts.find(a => a.id === c.accountId)?.name ?? '?'}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-emerald-500 ml-2">{formatCLP(c.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Sheet open={contributeOpen} onClose={() => setContributeOpen(false)} title="Aportar a meta">
        <form onSubmit={handleAddContribution} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Cuenta de origen</label>
            <select value={contributeAccountId} onChange={e => setContributeAccountId(e.target.value)}
              className="w-full h-11 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]">
              <option value="">Seleccionar cuenta</option>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Monto ($)</label>
            <input type="number" inputMode="decimal" value={contributeAmount} onChange={e => setContributeAmount(e.target.value)}
              className="w-full h-11 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
              placeholder="50000" min="0" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Fecha</label>
            <input type="date" value={contributeDate} onChange={e => setContributeDate(e.target.value)}
              className="w-full h-11 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]" />
          </div>
          {formError && <p className="text-sm text-[var(--color-danger)]">{formError}</p>}
          <button type="submit" disabled={formLoading}
            className="w-full h-11 rounded-lg bg-[var(--color-primary)] text-white font-medium hover:bg-[var(--color-primary-dark)] disabled:opacity-50 transition-colors">
            {formLoading ? 'Guardando…' : 'Aportar'}
          </button>
        </form>
      </Sheet>

      <ConfirmDialog
        open={deleteOpen}
        title="Eliminar meta"
        message={`¿Estás seguro de eliminar "${goal.name}"? Los aportes asociados también se eliminarán.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
        isLoading={formLoading}
      />
    </ProtectedRoute>
  );
}
