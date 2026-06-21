'use client';

import { useEffect, useMemo, useState } from 'react';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { useExpensesStore } from '../../store/expenses';
import { useIncomesStore } from '../../store/incomes';
import { useTransfersStore } from '../../store/transfers';
import { useAccountsStore } from '../../store/accounts';
import { formatCLP, formatDate } from '@finance-app/utils';

type TransactionKind = 'all' | 'expense' | 'income' | 'transfer';
type PeriodFilter = 'all' | 'month' | '3months';

interface TimelineItem {
  id: string;
  kind: 'expense' | 'income' | 'transfer';
  amount: number;
  description: string;
  transactionDate: string;
  accountName: string;
}

const kindLabels: Record<string, string> = {
  expense: 'Gasto',
  income: 'Ingreso',
  transfer: 'Transferencia',
};

const kindIcons: Record<string, string> = {
  expense: 'M20 12H4',
  income: 'M12 4v16m8-8H4',
  transfer: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4',
};

const kindColors: Record<string, string> = {
  expense: 'text-rose-500',
  income: 'text-emerald-500',
  transfer: 'text-blue-500',
};

const kindBgColors: Record<string, string> = {
  expense: 'bg-rose-100 dark:bg-rose-900/30',
  income: 'bg-emerald-100 dark:bg-emerald-900/30',
  transfer: 'bg-blue-100 dark:bg-blue-900/30',
};

function getPeriodStart(period: PeriodFilter): Date | null {
  const now = new Date();
  switch (period) {
    case 'month': {
      return new Date(now.getFullYear(), now.getMonth(), 1);
    }
    case '3months': {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 3);
      return d;
    }
    default:
      return null;
  }
}

function groupByDate(items: TimelineItem[]): Map<string, TimelineItem[]> {
  const groups = new Map<string, TimelineItem[]>();
  for (const item of items) {
    const existing = groups.get(item.transactionDate);
    if (existing) {
      existing.push(item);
    } else {
      groups.set(item.transactionDate, [item]);
    }
  }
  return groups;
}

function getWeekdayLabel(dateStr: string): string {
  const [year = 0, month = 0, day = 0] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = (today.getTime() - date.getTime()) / 86400000;

  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Ayer';
  return date.toLocaleDateString('es-CL', { weekday: 'long' });
}

export default function TransactionsPage() {
  const { expenses, fetchExpenses } = useExpensesStore();
  const { incomes, fetchIncomes } = useIncomesStore();
  const { transfers, fetchTransfers } = useTransfersStore();
  const { accounts, fetchAccounts } = useAccountsStore();

  const [kindFilter, setKindFilter] = useState<TransactionKind>('all');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('month');
  const [accountFilter, setAccountFilter] = useState<string>('all');

  const isLoading = expenses.length === 0 && incomes.length === 0 && transfers.length === 0;

  useEffect(() => {
    fetchExpenses();
    fetchIncomes();
    fetchTransfers();
    fetchAccounts();
  }, [fetchExpenses, fetchIncomes, fetchTransfers, fetchAccounts]);

  const accountMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of accounts) map.set(a.id, a.name);
    return map;
  }, [accounts]);

  const timeline = useMemo<TimelineItem[]>(() => {
    const periodStart = getPeriodStart(periodFilter);
    const items: TimelineItem[] = [];

    const addIfMatches = (
      kind: TimelineItem['kind'],
      list: { id: string; amount: number; description: string; transactionDate: string; accountId?: string; fromAccountId?: string; toAccountId?: string }[]
    ) => {
      for (const t of list) {
        if (accountFilter !== 'all') {
          if (kind === 'expense' && t.accountId !== accountFilter) continue;
          if (kind === 'income' && t.accountId !== accountFilter) continue;
          if (kind === 'transfer' && t.fromAccountId !== accountFilter && t.toAccountId !== accountFilter) continue;
        }

        if (periodStart && t.transactionDate < periodStart.toISOString().slice(0, 10)) continue;

        const accountName = kind === 'transfer'
          ? `${accountMap.get((t as typeof transfers[0]).fromAccountId) ?? '?'} → ${accountMap.get((t as typeof transfers[0]).toAccountId) ?? '?'}`
          : accountMap.get(t.accountId ?? '') ?? '?';

        items.push({
          id: t.id,
          kind,
          amount: t.amount,
          description: t.description,
          transactionDate: t.transactionDate,
          accountName,
        });
      }
    };

    if (kindFilter === 'all' || kindFilter === 'expense') addIfMatches('expense', expenses);
    if (kindFilter === 'all' || kindFilter === 'income') addIfMatches('income', incomes);
    if (kindFilter === 'all' || kindFilter === 'transfer') addIfMatches('transfer', transfers);

    items.sort((a, b) => b.transactionDate.localeCompare(a.transactionDate));
    return items;
  }, [expenses, incomes, transfers, accountMap, kindFilter, periodFilter, accountFilter]);

  const dateGroups = useMemo(() => groupByDate(timeline), [timeline]);

  return (
    <ProtectedRoute>
      <div className="p-4">
        <h2 className="text-xl font-semibold text-[var(--color-text)] mb-4">Transacciones</h2>

        <div className="flex flex-wrap gap-2 mb-4">
          {(['all', 'expense', 'income', 'transfer'] as const).map(k => (
            <button
              key={k}
              onClick={() => setKindFilter(k)}
              className={`h-9 px-3 rounded-lg text-sm font-medium transition-colors ${
                kindFilter === k
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:bg-[var(--color-surface-alt)]'
              }`}
            >
              {k === 'all' ? 'Todas' : kindLabels[k]}
            </button>
          ))}
        </div>

        <div className="flex gap-2 mb-4">
          <select
            value={periodFilter}
            onChange={e => setPeriodFilter(e.target.value as PeriodFilter)}
            className="flex-1 h-9 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] transition-colors"
          >
            <option value="month">Este mes</option>
            <option value="3months">Últimos 3 meses</option>
            <option value="all">Todo</option>
          </select>

          <select
            value={accountFilter}
            onChange={e => setAccountFilter(e.target.value)}
            className="flex-1 h-9 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] transition-colors"
          >
            <option value="all">Todas las cuentas</option>
            {accounts.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-16 rounded-xl bg-[var(--color-surface)] animate-pulse" />
            ))}
          </div>
        ) : timeline.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-16 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--color-text-secondary)] mb-4">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-[var(--color-text-secondary)] font-medium">No hay transacciones</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {Array.from(dateGroups.entries()).map(([date, items]) => (
              <div key={date}>
                <div className="flex items-center gap-2 py-3">
                  <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
                    {formatDate(date)}
                  </span>
                  <span className="text-[10px] text-[var(--color-text-secondary)] capitalize">
                    {getWeekdayLabel(date)}
                  </span>
                  <div className="flex-1 h-px bg-[var(--color-border)]" />
                </div>

                {items.map(item => (
                  <div
                    key={`${item.kind}-${item.id}`}
                    className="flex items-center gap-3 rounded-xl bg-[var(--color-surface)] p-3 mb-2 border border-[var(--color-border)]"
                  >
                    <div className={`flex items-center justify-center w-9 h-9 rounded-full ${kindBgColors[item.kind]}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={kindColors[item.kind]}>
                        <path d={kindIcons[item.kind]} />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--color-text)] truncate">
                        {item.description || kindLabels[item.kind]}
                      </p>
                      <p className="text-xs text-[var(--color-text-secondary)] truncate">
                        {item.accountName}
                      </p>
                    </div>
                    <span className={`text-sm font-semibold whitespace-nowrap ${
                      item.kind === 'income' ? 'text-emerald-500' : item.kind === 'expense' ? 'text-rose-500' : 'text-[var(--color-text)]'
                    }`}>
                      {item.kind === 'income' ? '+' : item.kind === 'expense' ? '-' : ''}{formatCLP(item.amount)}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
