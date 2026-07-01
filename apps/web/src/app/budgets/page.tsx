'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { PlusIcon, CurrencyDollarIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Sheet } from '@/components/Sheet';
import { Skeleton } from '@/components/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import { SwipeDeleteAction } from '@/hooks/useSwipeToDelete';
import { useBudgetsStore } from '@/store/budgets';
import { useCategoriesStore } from '@/store/categories';
import { useExpensesStore } from '@/store/expenses';
import { useCardChargesStore } from '@/store/card-charges';
import { formatCLP, toCents, getPeriodYYYYMM } from '@finance-app/utils';

function getMonthLabel(period: string): string {
  const [y, m] = period.split('-').map(Number);
  const months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  return `${months[(m ?? 1) - 1]} ${y}`;
}

function computeBudgetSpent(
  categoryId: string,
  period: string,
  expenses: Array<{ categoryId: string; transactionDate: string; amount: number }>,
  charges: Array<{ categoryId: string; transactionDate: string; amount: number }>,
): number {
  const spentExpenses = expenses
    .filter(e => e.categoryId === categoryId && e.transactionDate.startsWith(period))
    .reduce((sum, e) => sum + e.amount, 0);
  const spentCharges = charges
    .filter(c => c.categoryId === categoryId && c.transactionDate.startsWith(period))
    .reduce((sum, c) => sum + c.amount, 0);
  return spentExpenses + spentCharges;
}

export default function BudgetsPage() {
  const { budgets, isLoading, fetchBudgets, createBudget, deleteBudget } = useBudgetsStore();
  const { categories, fetchCategories } = useCategoriesStore();
  const { expenses, fetchExpenses } = useExpensesStore();
  const { charges, fetchAllCharges } = useCardChargesStore();

  const [selectedPeriod, setSelectedPeriod] = useState(() => getPeriodYYYYMM(new Date()));
  const [createOpen, setCreateOpen] = useState(false);
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchBudgets();
    fetchCategories();
    fetchExpenses();
    fetchAllCharges();
  }, [fetchBudgets, fetchCategories, fetchExpenses, fetchAllCharges]);

  const periodBudgets = useMemo(
    () => budgets.filter(b => b.period === selectedPeriod),
    [budgets, selectedPeriod]
  );

  const budgetWithSpent = useMemo(() => {
    return periodBudgets.map(b => {
      const spent = computeBudgetSpent(b.categoryId, selectedPeriod, expenses, charges);
      return { ...b, spent, usagePct: b.limitAmount > 0 ? Math.min(100, Math.round((spent / b.limitAmount) * 100)) : 0 };
    });
  }, [periodBudgets, selectedPeriod, expenses, charges]);

  const handlePrevMonth = () => {
    const [y, m] = selectedPeriod.split('-').map(Number);
    const d = new Date(y ?? 0, (m ?? 1) - 2, 1);
    setSelectedPeriod(getPeriodYYYYMM(d));
  };

  const isCurrentPeriod = useMemo(() => {
    return selectedPeriod === getPeriodYYYYMM(new Date());
  }, [selectedPeriod]);

  const handleNextMonth = () => {
    if (isCurrentPeriod) return;
    const [y, m] = selectedPeriod.split('-').map(Number);
    const d = new Date(y ?? 0, (m ?? 1), 1);
    setSelectedPeriod(getPeriodYYYYMM(d));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!formCategoryId) { setFormError('Selecciona una categoría'); return; }
    const limitAmount = toCents(Number.parseFloat(formAmount));
    if (Number.isNaN(limitAmount) || limitAmount <= 0) { setFormError('Monto inválido'); return; }

    const exists = budgets.find(b => b.categoryId === formCategoryId && b.period === selectedPeriod);
    if (exists) { setFormError('Ya existe un presupuesto para esta categoría en este mes'); return; }

    setFormLoading(true);
    await createBudget({ categoryId: formCategoryId, period: selectedPeriod, limitAmount });
    setFormLoading(false);
    setCreateOpen(false);
    setFormCategoryId('');
    setFormAmount('');
  };

  const expenseCategories = useMemo(
    () => categories.filter(c => c.type === 'expense'),
    [categories]
  );

  const categoriesWithoutBudget = useMemo(
    () => expenseCategories.filter(c => !periodBudgets.some(b => b.categoryId === c.id)),
    [expenseCategories, periodBudgets]
  );

  return (
    <ProtectedRoute>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-[var(--color-text)]">Presupuestos</h2>
          <button onClick={() => setCreateOpen(true)}
            className="flex items-center justify-center w-10 h-10 rounded-lg text-[var(--color-primary)] hover:bg-[var(--color-surface-alt)] transition-colors">
            <PlusIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center justify-center gap-2 mb-6">
          <button onClick={handlePrevMonth} className="p-2 hover:bg-[var(--color-surface-alt)] rounded-lg transition-colors text-[var(--color-text-secondary)]">
            <ChevronLeftIcon className="w-4 h-4" />
          </button>
          <span className="text-sm font-bold text-[var(--color-text)] min-w-[140px] text-center">
            {getMonthLabel(selectedPeriod)}
          </span>
          <button onClick={handleNextMonth} disabled={isCurrentPeriod}
            className={`p-2 rounded-lg transition-colors ${isCurrentPeriod ? 'text-[var(--color-border)] cursor-not-allowed' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)]'}`}>
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        </div>

        {isLoading ? (
          <Skeleton className="h-24 w-full" count={3} />
        ) : periodBudgets.length === 0 ? (
          <EmptyState icon={CurrencyDollarIcon} title="Sin presupuestos" subtitle={`No hay presupuestos para ${getMonthLabel(selectedPeriod)}`} />
        ) : (
          <div className="flex flex-col gap-3">
            {budgetWithSpent.map(b => {
              const category = categories.find(c => c.id === b.categoryId);
              const isOverBudget = b.spent > b.limitAmount;
              const isWarning = b.usagePct >= 75 && !isOverBudget;
              const barColor = isOverBudget ? 'var(--color-danger)' : isWarning ? '#eab308' : '#22c55e';

              return (
                <div key={b.id} data-swipe-id={b.id} className="relative overflow-hidden">
                  <SwipeDeleteAction onDelete={() => deleteBudget(b.id)} />
                  <Link href={`/budgets/${b.id}`}
                    className="relative z-10 block rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4 hover:bg-[var(--color-surface-alt)] transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-lg">{category?.icon ?? '📁'}</span>
                        <span className="font-medium text-[var(--color-text)] truncate">{category?.name ?? '?'}</span>
                      </div>
                      <span className={`text-sm font-semibold ${isOverBudget ? 'text-[var(--color-danger)]' : 'text-[var(--color-text)]'}`}>
                        {formatCLP(b.spent)} / {formatCLP(b.limitAmount)}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--color-surface-alt)] overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${b.usagePct}%`, backgroundColor: barColor }} />
                    </div>
                    <p className={`text-xs mt-1 font-medium ${isOverBudget ? 'text-[var(--color-danger)]' : isWarning ? 'text-yellow-500' : 'text-[var(--color-text-secondary)]'}`}>
                      {isOverBudget ? `Excedido en ${formatCLP(b.spent - b.limitAmount)}` : `${b.usagePct}% usado - ${formatCLP(b.limitAmount - b.spent)} disponible`}
                    </p>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Sheet open={createOpen} onClose={() => setCreateOpen(false)} title="Nuevo presupuesto">
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Categoría</label>
            <select value={formCategoryId} onChange={e => setFormCategoryId(e.target.value)}
              className="w-full h-11 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]">
              <option value="">Seleccionar categoría</option>
              {categoriesWithoutBudget.map(c => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Límite mensual ($)</label>
            <input type="number" inputMode="decimal" value={formAmount} onChange={e => setFormAmount(e.target.value)}
              className="w-full h-11 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
              placeholder="200000" min="0" />
          </div>
          <p className="text-xs text-[var(--color-text-secondary)]">Período: {getMonthLabel(selectedPeriod)}</p>
          {formError && <p className="text-sm text-[var(--color-danger)]">{formError}</p>}
          <button type="submit" disabled={formLoading}
            className="w-full h-11 rounded-lg bg-[var(--color-primary)] text-white font-medium hover:bg-[var(--color-primary-dark)] disabled:opacity-50 transition-colors">
            {formLoading ? 'Guardando…' : 'Crear presupuesto'}
          </button>
        </form>
      </Sheet>
    </ProtectedRoute>
  );
}
