'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import { Skeleton } from '@/components/Skeleton';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Sheet } from '@/components/Sheet';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useBudgetsStore } from '@/store/budgets';
import { useCategoriesStore } from '@/store/categories';
import { useExpensesStore } from '@/store/expenses';
import { useCardChargesStore } from '@/store/card-charges';
import { formatCLP, toCents } from '@finance-app/utils';

export default function BudgetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { budgets, fetchBudgets, updateBudget, deleteBudget } = useBudgetsStore();
  const { categories, fetchCategories } = useCategoriesStore();
  const { expenses, fetchExpenses } = useExpensesStore();
  const { charges, fetchAllCharges } = useCardChargesStore();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [editAmount, setEditAmount] = useState('');

  const budget = budgets.find(b => b.id === id);
  const category = budget ? categories.find(c => c.id === budget.categoryId) : undefined;

  useEffect(() => {
    fetchBudgets();
    fetchCategories();
    fetchExpenses();
    fetchAllCharges();
  }, [fetchBudgets, fetchCategories, fetchExpenses, fetchAllCharges]);

  const periodTransactions = useMemo(() => {
    if (!budget) return [];
    const monthExpenses = expenses
      .filter(e => e.categoryId === budget.categoryId && e.transactionDate.startsWith(budget.period))
      .map(e => ({ id: e.id, type: 'expense' as const, description: e.description, amount: e.amount, date: e.transactionDate }));
    const monthCharges = charges
      .filter(c => c.categoryId === budget.categoryId && c.transactionDate.startsWith(budget.period))
      .map(c => ({ id: c.id, type: 'charge' as const, description: c.description, amount: c.amount, date: c.transactionDate }));
    return [...monthExpenses, ...monthCharges]
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [budget, expenses, charges]);

  const spent = useMemo(
    () => periodTransactions.reduce((sum, t) => sum + t.amount, 0),
    [periodTransactions]
  );

  const usagePct = budget && budget.limitAmount > 0
    ? Math.min(100, Math.round((spent / budget.limitAmount) * 100))
    : 0;

  const remaining = budget ? Math.max(0, budget.limitAmount - spent) : 0;
  const isOverBudget = budget ? spent > budget.limitAmount : false;
  const isWarning = usagePct >= 75 && !isOverBudget;

  const handleDelete = async () => {
    setFormLoading(true);
    await deleteBudget(id);
    setFormLoading(false);
    router.push('/budgets');
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const limitAmount = toCents(Number.parseFloat(editAmount));
    if (Number.isNaN(limitAmount) || limitAmount <= 0) { setFormError('Monto inválido'); return; }
    setFormLoading(true);
    await updateBudget(id, { limitAmount });
    setFormLoading(false);
    setEditOpen(false);
  };

  if (!budget) {
    return (
      <ProtectedRoute>
        <div className="p-4">
          <p className="text-[var(--color-text-secondary)]">Cargando…</p>
          <Skeleton className="h-40 w-full mt-4" />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => router.back()} className="flex items-center justify-center w-10 h-10 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)] transition-colors">
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-semibold text-[var(--color-text)]">{category?.name ?? 'Presupuesto'}</h2>
        </div>

        <div className={`rounded-2xl p-5 mb-4 ${isOverBudget ? 'bg-gradient-to-br from-rose-500 to-red-600' : isWarning ? 'bg-gradient-to-br from-yellow-500 to-amber-600' : 'bg-gradient-to-br from-emerald-500 to-green-600'} text-white`}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{category?.icon ?? '📁'}</span>
            <p className="text-sm font-medium opacity-80">{budget.period}</p>
          </div>
          <p className="text-3xl font-bold mt-1">{formatCLP(budget.limitAmount)}</p>
          <p className="text-xs opacity-80 mt-1">Límite mensual</p>
          <div className="mt-4 pt-4 border-t border-white/20">
            <div className="flex justify-between text-sm">
              <span>Gastado</span>
              <span className="font-semibold">{formatCLP(spent)}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span>Disponible</span>
              <span className="font-semibold">{formatCLP(remaining)}</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-xs mb-1">
              <span>Progreso</span>
              <span>{usagePct}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/20 overflow-hidden">
              <div className="h-full rounded-full bg-white transition-all" style={{ width: `${usagePct}%` }} />
            </div>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <button onClick={() => { setEditAmount(String(Number(budget.limitAmount) / 100)); setEditOpen(true); }}
            className="flex-1 h-10 rounded-lg bg-[var(--color-primary)] text-white text-sm font-medium hover:bg-[var(--color-primary-dark)] transition-colors">
            Editar límite
          </button>
        </div>

        <button onClick={() => setDeleteOpen(true)}
          className="w-full h-10 rounded-lg border border-[var(--color-danger)] text-[var(--color-danger)] text-sm font-medium hover:bg-[var(--color-danger)] hover:text-white transition-colors mb-4">
          Eliminar presupuesto
        </button>

        {periodTransactions.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-text)] mb-2">Transacciones del período</h3>
            <div className="flex flex-col gap-2">
              {periodTransactions.map(t => (
                <div key={t.id} className="flex items-center justify-between rounded-xl bg-[var(--color-surface)] p-3 border border-[var(--color-border)]">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[var(--color-text)] truncate">{t.description || 'Sin descripción'}</p>
                    <p className="text-xs text-[var(--color-text-secondary)]">{t.date} · {t.type === 'expense' ? 'Gasto' : 'Cargo tarjeta'}</p>
                  </div>
                  <span className="text-sm font-semibold text-rose-500 ml-2">{formatCLP(t.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Sheet open={editOpen} onClose={() => setEditOpen(false)} title="Editar límite">
        <form onSubmit={handleEdit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Nuevo límite mensual ($)</label>
            <input type="number" inputMode="decimal" value={editAmount} onChange={e => setEditAmount(e.target.value)}
              className="w-full h-11 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
              placeholder="200000" min="0" />
          </div>
          {formError && <p className="text-sm text-[var(--color-danger)]">{formError}</p>}
          <button type="submit" disabled={formLoading}
            className="w-full h-11 rounded-lg bg-[var(--color-primary)] text-white font-medium hover:bg-[var(--color-primary-dark)] disabled:opacity-50 transition-colors">
            {formLoading ? 'Guardando…' : 'Guardar'}
          </button>
        </form>
      </Sheet>

      <ConfirmDialog
        open={deleteOpen}
        title="Eliminar presupuesto"
        message={`¿Estás seguro de eliminar el presupuesto de "${category?.name ?? '?'}" para ${budget.period}?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
        isLoading={formLoading}
      />
    </ProtectedRoute>
  );
}
