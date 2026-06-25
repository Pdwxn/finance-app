'use client';

import { useEffect, useState, useMemo } from 'react';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, ArrowsRightLeftIcon, ReceiptPercentIcon, FunnelIcon, PlusIcon } from '@heroicons/react/24/outline';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Skeleton } from '@/components/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import { TransactionSheet } from '@/components/TransactionSheet';
import { useExpensesStore } from '@/store/expenses';
import { useIncomesStore } from '@/store/incomes';
import { useTransfersStore } from '@/store/transfers';
import { useAccountsStore } from '@/store/accounts';
import { formatCLP } from '@finance-app/utils';

type TypeFilter = 'all' | 'expense' | 'income' | 'transfer';
type PeriodFilter = 'month' | 'quarter' | 'all';

interface UnifiedItem {
  id: string;
  type: 'expense' | 'income' | 'transfer';
  amount: number;
  description: string;
  date: string;
  accountId: string;
  categoryId?: string;
  fromAccountId?: string;
  toAccountId?: string;
}

export default function TransactionsPage() {
  const { expenses, isLoading: loadingExpenses, fetchExpenses } = useExpensesStore();
  const { incomes, isLoading: loadingIncomes, fetchIncomes } = useIncomesStore();
  const { transfers, isLoading: loadingTransfers, fetchTransfers } = useTransfersStore();
  const { accounts, fetchAccounts } = useAccountsStore();

  const [transactionSheetOpen, setTransactionSheetOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('month');
  const [accountFilter, setAccountFilter] = useState<string>('all');

  useEffect(() => {
    fetchExpenses();
    fetchIncomes();
    fetchTransfers();
    fetchAccounts();
  }, [fetchExpenses, fetchIncomes, fetchTransfers, fetchAccounts]);

  const unified = useMemo(() => {
    const items: UnifiedItem[] = [
      ...expenses.map(e => ({ id: e.id, type: 'expense' as const, amount: e.amount, description: e.description, date: e.transactionDate, accountId: e.accountId, categoryId: e.categoryId })),
      ...incomes.map(i => ({ id: i.id, type: 'income' as const, amount: i.amount, description: i.description, date: i.transactionDate, accountId: i.accountId, categoryId: i.categoryId })),
      ...transfers.map(t => ({ id: t.id, type: 'transfer' as const, amount: t.amount, description: t.description, date: t.transactionDate, accountId: t.fromAccountId, fromAccountId: t.fromAccountId, toAccountId: t.toAccountId })),
    ];

    const now = new Date();
    const filtered = items.filter(item => {
      if (typeFilter !== 'all' && item.type !== typeFilter) return false;
      if (accountFilter !== 'all' && item.accountId !== accountFilter && item.fromAccountId !== accountFilter && item.toAccountId !== accountFilter) return false;
      if (periodFilter === 'month') {
        const d = new Date(item.date + 'T00:00:00Z');
        if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) return false;
      } else if (periodFilter === 'quarter') {
        const d = new Date(item.date + 'T00:00:00Z');
        const qStart = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        if (d < qStart) return false;
      }
      return true;
    });

    return filtered.sort((a, b) => b.date.localeCompare(a.date));
  }, [expenses, incomes, transfers, typeFilter, periodFilter, accountFilter]);

  const typePills: { label: string; value: TypeFilter }[] = [
    { label: 'Todas', value: 'all' },
    { label: 'Gastos', value: 'expense' },
    { label: 'Ingresos', value: 'income' },
    { label: 'Transferencias', value: 'transfer' },
  ];

  const periodPills: { label: string; value: PeriodFilter }[] = [
    { label: 'Este mes', value: 'month' },
    { label: 'Últimos 3 meses', value: 'quarter' },
    { label: 'Todo', value: 'all' },
  ];

  const isLoading = loadingExpenses || loadingIncomes || loadingTransfers;

  return (
    <ProtectedRoute>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-[var(--color-text)]">Transacciones</h2>
          <FunnelIcon className="w-5 h-5 text-[var(--color-text-secondary)]" />
        </div>

        <div className="flex gap-2 mb-3 overflow-x-auto scrollbar-none">
          {typePills.map(pill => (
            <button key={pill.value} onClick={() => setTypeFilter(pill.value)}
              className={`shrink-0 h-8 px-3 rounded-lg text-xs font-medium transition-colors ${
                typeFilter === pill.value
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)]'
              }`}>
              {pill.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2 mb-3 overflow-x-auto scrollbar-none">
          {periodPills.map(pill => (
            <button key={pill.value} onClick={() => setPeriodFilter(pill.value)}
              className={`shrink-0 h-8 px-3 rounded-lg text-xs font-medium transition-colors ${
                periodFilter === pill.value
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)]'
              }`}>
              {pill.label}
            </button>
          ))}
        </div>

        <select value={accountFilter} onChange={e => setAccountFilter(e.target.value)}
          className="w-full h-9 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-xs text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] mb-3">
          <option value="all">Todas las cuentas</option>
          {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>

        {isLoading ? (
          <Skeleton className="h-14 w-full" count={5} />
        ) : unified.length === 0 ? (
          <EmptyState icon={ReceiptPercentIcon} title="No hay transacciones" subtitle="Agrega gastos, ingresos o transferencias" />
        ) : (
          <div className="flex flex-col gap-2">
            {unified.map(item => {
              const account = accounts.find(a => a.id === item.accountId);
              return (
                <div key={item.id} className="flex items-center gap-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-3">
                  <div className={`flex items-center justify-center w-9 h-9 rounded-full ${
                    item.type === 'expense' ? 'bg-rose-100 dark:bg-rose-900/40' : item.type === 'income' ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-blue-100 dark:bg-blue-900/40'
                  }`}>
                    {item.type === 'expense' ? (
                      <ArrowTrendingDownIcon className="w-4 h-4 text-rose-500" />
                    ) : item.type === 'income' ? (
                      <ArrowTrendingUpIcon className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <ArrowsRightLeftIcon className="w-4 h-4 text-blue-500" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[var(--color-text)] truncate">{item.description}</p>
                    <p className="text-xs text-[var(--color-text-secondary)]">{account?.name ?? '…'} · {item.date}</p>
                  </div>
                  <span className={`text-sm font-semibold ml-2 ${
                    item.type === 'expense' ? 'text-rose-500' : item.type === 'income' ? 'text-emerald-500' : 'text-blue-500'
                  }`}>
                    {item.type === 'expense' ? '-' : '+'}{formatCLP(item.amount)}
                  </span>
                </div>
              );
            })}
          </div>
          )}
        </div>

        <button onClick={() => setTransactionSheetOpen(true)}
        className="fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full bg-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-primary)]/30 hover:bg-[var(--color-primary-dark)] transition-all active:scale-95 flex items-center justify-center">
        <PlusIcon className="w-6 h-6" />
      </button>

      <TransactionSheet open={transactionSheetOpen} onClose={() => setTransactionSheetOpen(false)} />
    </ProtectedRoute>
  );
}
