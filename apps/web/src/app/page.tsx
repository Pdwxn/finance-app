'use client';

import { useEffect, useMemo } from 'react';
import { Skeleton } from '@/components/Skeleton';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAccountsStore } from '@/store/accounts';
import { useExpensesStore } from '@/store/expenses';
import { useIncomesStore } from '@/store/incomes';
import { useCategoriesStore } from '@/store/categories';
import { formatCLP } from '@finance-app/utils';

function currentMonthRange(): [string, string] {
  const now = new Date();
  const start = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const end = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-31`;
  return [start, end];
}

export default function Home() {
  const { accounts, fetchAccounts } = useAccountsStore();
  const { expenses, fetchExpenses } = useExpensesStore();
  const { incomes, fetchIncomes } = useIncomesStore();
  const { categories, fetchCategories } = useCategoriesStore();

  useEffect(() => {
    fetchAccounts();
    fetchExpenses();
    fetchIncomes();
    fetchCategories();
  }, [fetchAccounts, fetchExpenses, fetchIncomes, fetchCategories]);

  const [monthStart, monthEnd] = useMemo(currentMonthRange, []);

  const netWorth = useMemo(() => {
    const initialSum = accounts.reduce((sum, a) => sum + a.initialBalance, 0);
    const incomeSum = incomes.reduce((sum, i) => sum + i.amount, 0);
    const expenseSum = expenses.reduce((sum, e) => sum + e.amount, 0);
    return initialSum + incomeSum - expenseSum;
  }, [accounts, incomes, expenses]);

  const monthlyIncome = useMemo(() => {
    return incomes
      .filter(i => i.transactionDate >= monthStart && i.transactionDate <= monthEnd)
      .reduce((sum, i) => sum + i.amount, 0);
  }, [incomes, monthStart, monthEnd]);

  const monthlyExpense = useMemo(() => {
    return expenses
      .filter(e => e.transactionDate >= monthStart && e.transactionDate <= monthEnd)
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses, monthStart, monthEnd]);

  const topCategories = useMemo(() => {
    const monthly = expenses.filter(e => e.transactionDate >= monthStart && e.transactionDate <= monthEnd);
    const grouped = new Map<string, number>();
    for (const e of monthly) {
      grouped.set(e.categoryId, (grouped.get(e.categoryId) ?? 0) + e.amount);
    }
    return Array.from(grouped.entries())
      .map(([categoryId, total]) => ({
        categoryId,
        total,
        category: categories.find(c => c.id === categoryId),
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [expenses, categories, monthStart, monthEnd]);

  const isLoading = accounts.length === 0;

  return (
    <ProtectedRoute>
      <div className="p-4 space-y-4">
        <h2 className="text-xl font-semibold text-[var(--color-text)]">Dashboard</h2>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-28 w-full rounded-2xl" />
            ))}
          </div>
        ) : (
          <>
            <div className="rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] p-5 text-white">
              <p className="text-sm font-medium opacity-80">Patrimonio neto</p>
              <p className="text-3xl font-bold mt-1">{formatCLP(netWorth)}</p>
              <div className="flex gap-4 mt-3 text-sm">
                <div>
                  <span className="opacity-80">Ingresos</span>
                  <p className="font-semibold">{formatCLP(monthlyIncome)}</p>
                </div>
                <div>
                  <span className="opacity-80">Gastos</span>
                  <p className="font-semibold">{formatCLP(monthlyExpense)}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-[var(--color-text)]">Flujo de caja</h3>
                <span className="text-[11px] text-[var(--color-text-secondary)]">Este mes</span>
              </div>
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <div className="flex justify-between text-xs text-[var(--color-text-secondary)] mb-1">
                    <span>Ingresos</span>
                    <span className="text-emerald-500 font-medium">{formatCLP(monthlyIncome)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--color-surface-alt)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${Math.min(100, (monthlyIncome / (monthlyIncome || monthlyExpense || 1)) * 100)}%` }}
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between text-xs text-[var(--color-text-secondary)] mb-1">
                    <span>Gastos</span>
                    <span className="text-rose-500 font-medium">{formatCLP(monthlyExpense)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--color-surface-alt)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-rose-500 transition-all"
                      style={{ width: `${Math.min(100, (monthlyExpense / (monthlyIncome || monthlyExpense || 1)) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-[var(--color-border)]">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--color-text-secondary)]">Saldo del mes</span>
                  <span className={`font-semibold ${monthlyIncome - monthlyExpense >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {formatCLP(monthlyIncome - monthlyExpense)}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-[var(--color-text)]">Presupuesto</h3>
                <span className="text-[11px] text-[var(--color-text-secondary)]">Este mes</span>
              </div>
              <div className="flex items-end gap-2 mb-2">
                <span className="text-2xl font-bold text-[var(--color-text)]">{formatCLP(monthlyExpense)}</span>
                <span className="text-sm text-[var(--color-text-secondary)] mb-1">gastados</span>
              </div>
              {monthlyIncome > 0 && (
                <div>
                  <div className="h-2 rounded-full bg-[var(--color-surface-alt)] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, (monthlyExpense / monthlyIncome) * 100)}%`,
                        background: monthlyExpense > monthlyIncome
                          ? 'var(--color-danger)'
                          : monthlyExpense > monthlyIncome * 0.8
                            ? 'var(--color-warning)'
                            : 'var(--color-primary)',
                      }}
                    />
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                    {Math.round((monthlyExpense / monthlyIncome) * 100)}% de tus ingresos
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-[var(--color-text)]">Categorías principales</h3>
                <span className="text-[11px] text-[var(--color-text-secondary)]">Este mes</span>
              </div>
              {topCategories.length === 0 && (
                <p className="text-sm text-[var(--color-text-secondary)]">Sin gastos este mes</p>
              )}
              <div className="space-y-3">
                {topCategories.map(({ categoryId, total, category }) => {
                  const maxTotal = topCategories[0]?.total ?? 1;
                  return (
                    <div key={categoryId}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-[var(--color-text)] font-medium truncate mr-2">
                          {category?.name ?? 'Sin categoría'}
                        </span>
                        <span className="text-[var(--color-text-secondary)] font-medium whitespace-nowrap">
                          {formatCLP(total)}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[var(--color-surface-alt)] overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(total / maxTotal) * 100}%`,
                            backgroundColor: category?.color ?? 'var(--color-primary)',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}
