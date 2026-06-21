'use client';

import { useEffect, useMemo, useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useExpensesStore } from '@/store/expenses';
import { useIncomesStore } from '@/store/incomes';
import { useCategoriesStore } from '@/store/categories';
import { useAccountsStore } from '@/store/accounts';
import { useDebtsStore } from '@/store/debts';
import { formatCLP } from '@finance-app/utils';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, Cell,
  type TooltipContentProps,
} from 'recharts';

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const SPENDING_COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#06b6d4'];

function monthKey(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00Z');
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(key: string) {
  const parts = key.split('-');
  const m = parts[1];
  if (!m) return '';
  return MONTHS[Number.parseInt(m) - 1] ?? '';
}

export default function ReportsPage() {
  const { expenses, fetchExpenses } = useExpensesStore();
  const { incomes, fetchIncomes } = useIncomesStore();
  const { categories, fetchCategories, getCategoryById } = useCategoriesStore();
  const { accounts, fetchAccounts } = useAccountsStore();
  const { debts, fetchDebts } = useDebtsStore();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchExpenses(),
      fetchIncomes(),
      fetchCategories(),
      fetchAccounts(),
      fetchDebts(),
    ]).then(() => setLoading(false));
  }, [fetchExpenses, fetchIncomes, fetchCategories, fetchAccounts, fetchDebts]);

  const cashflowData = useMemo(() => {
    const map = new Map<string, { month: string; income: number; expense: number }>();
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      map.set(key, { month: monthLabel(key), income: 0, expense: 0 });
    }
    for (const inc of incomes) {
      const key = monthKey(inc.transactionDate);
      if (map.has(key)) map.get(key)!.income += inc.amount;
    }
    for (const exp of expenses) {
      const key = monthKey(exp.transactionDate);
      if (map.has(key)) map.get(key)!.expense += exp.amount;
    }
    return Array.from(map.values());
  }, [incomes, expenses]);

  const spendingByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const exp of expenses) {
      map.set(exp.categoryId, (map.get(exp.categoryId) ?? 0) + exp.amount);
    }
    return Array.from(map.entries())
      .map(([categoryId, amount]) => ({
        name: getCategoryById(categoryId)?.name ?? 'Sin categoría',
        amount,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [expenses, categories]);

  const totalIncome = useMemo(() => incomes.reduce((s, i) => s + i.amount, 0), [incomes]);
  const totalExpense = useMemo(() => expenses.reduce((s, e) => s + e.amount, 0), [expenses]);

  const netWorth = useMemo(() => {
    const totalAssets = accounts.reduce((s, a) => {
      return s + a.initialBalance + totalIncome - totalExpense;
    }, 0);
    const totalDebts = debts.reduce((s, d) => d.initialAmount + s, 0);
    return totalAssets - totalDebts;
  }, [accounts, debts, totalIncome, totalExpense]);

  function CashflowTooltip(props: TooltipContentProps) {
    if (!props.active || !props.payload || props.payload.length === 0) return null;
    return (
      <div className="rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] p-3 shadow-lg text-xs">
        <p className="font-medium text-[var(--color-text)] mb-1">{props.label}</p>
        {props.payload.map((p, i) => (
          <p key={i} className={p.name === 'Ingresos' ? 'text-emerald-500' : 'text-rose-500'}>
            {p.name}: {formatCLP(Number(p.value))}
          </p>
        ))}
      </div>
    );
  }

  function SpendingTooltip(props: TooltipContentProps) {
    if (!props.active || !props.payload || props.payload.length === 0) return null;
    const val = props.payload[0]?.value;
    if (val == null) return null;
    return (
      <div className="rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] p-3 shadow-lg text-xs">
        <p className="font-medium text-[var(--color-text)]">{props.label}: {formatCLP(Number(val))}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="p-4 space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-64 rounded-xl bg-[var(--color-surface)] animate-pulse" />)}
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="p-4 pb-24 space-y-6">
        <h2 className="text-xl font-semibold text-[var(--color-text)]">Reportes</h2>

        <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4">
          <h3 className="text-sm font-semibold text-[var(--color-text)] mb-1">Patrimonio neto</h3>
          <p className="text-2xl font-bold text-[var(--color-text)]">{formatCLP(netWorth)}</p>
          <div className="flex gap-4 mt-2 text-xs">
            <span className="text-emerald-500">Ingresos: {formatCLP(totalIncome)}</span>
            <span className="text-rose-500">Gastos: {formatCLP(totalExpense)}</span>
          </div>
        </div>

        <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4">
          <h3 className="text-sm font-semibold text-[var(--color-text)] mb-3">Flujo de caja mensual</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={cashflowData} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} tickFormatter={v => `$${Math.round(v / 1000)}k`} />
              <Tooltip content={CashflowTooltip} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="income" name="Ingresos" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="Gastos" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4">
          <h3 className="text-sm font-semibold text-[var(--color-text)] mb-3">Gastos por categoría</h3>
          {spendingByCategory.length === 0 ? (
            <p className="text-sm text-[var(--color-text-secondary)]">Sin gastos registrados</p>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(200, spendingByCategory.length * 36)}>
              <BarChart data={spendingByCategory} layout="vertical" margin={{ left: 0, right: 0, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} tickFormatter={v => `$${Math.round(v / 1000)}k`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} width={80} />
                <Tooltip content={SpendingTooltip} />
                <Bar dataKey="amount" radius={[0, 4, 4, 0]} maxBarSize={20}>
                  {spendingByCategory.map((_, i) => (
                    <Cell key={i} fill={SPENDING_COLORS[i % SPENDING_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
