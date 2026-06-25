'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  ArrowDownLeftIcon, 
  ArrowUpRightIcon, 
  FolderOpenIcon, 
  PlusIcon 
} from '@heroicons/react/24/outline';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

import { Skeleton } from '@/components/Skeleton';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Sheet } from '@/components/Sheet';
import { TransactionSheet } from '@/components/TransactionSheet';
import { useAccountsStore } from '@/store/accounts';
import { useExpensesStore } from '@/store/expenses';
import { useIncomesStore } from '@/store/incomes';
import { useCategoriesStore } from '@/store/categories';
import { useCardChargesStore } from '@/store/card-charges';
import { useTransfersStore } from '@/store/transfers';
import { formatCLP } from '@finance-app/utils';
import type { Category } from '@finance-app/types';

interface DashboardTransaction {
  id: string;
  type: 'expense' | 'income' | 'transfer';
  amount: number;
  description: string;
  date: string;
  createdAt: string;
  category?: Category;
}

function getCategoryEmoji(categoryName: string = ''): string {
  const name = categoryName.toLowerCase();
  if (name.includes('comida') || name.includes('food') || name.includes('restaurante')) return '🍔';
  if (name.includes('café') || name.includes('cafe') || name.includes('coffee') || name.includes('dunkin')) return '☕';
  if (name.includes('supermercado') || name.includes('grocery') || name.includes('aldi') || name.includes('lider') || name.includes('compras')) return '🛒';
  if (name.includes('transporte') || name.includes('uber') || name.includes('bencina')) return '🚗';
  if (name.includes('entretenimiento') || name.includes('cine') || name.includes('netflix') || name.includes('ocio')) return '🍿';
  if (name.includes('servicios') || name.includes('luz') || name.includes('agua') || name.includes('gas') || name.includes('cuentas')) return '⚡';
  if (name.includes('salud') || name.includes('farmacia') || name.includes('médico') || name.includes('doctor')) return '💊';
  if (name.includes('shopping') || name.includes('ropa') || name.includes('tienda')) return '🛍️';
  return '💸';
}

function formatDateSpanish(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00'); // Evita desfases de zona horaria
  return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
}

function formatDisplayDate(dateStr: string): string {
  const formatted = formatDateSpanish(dateStr);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export default function Home() {
  const { accounts, isLoading: accountsLoading, fetchAccounts } = useAccountsStore();
  const { expenses, isLoading: expensesLoading, fetchExpenses } = useExpensesStore();
  const { incomes, isLoading: incomesLoading, fetchIncomes } = useIncomesStore();
  const { categories, isLoading: categoriesLoading, fetchCategories } = useCategoriesStore();
  const { charges, isLoading: chargesLoading, fetchAllCharges } = useCardChargesStore();
  const { transfers, fetchTransfers } = useTransfersStore();

  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [selectedTx, setSelectedTx] = useState<DashboardTransaction | null>(null);
  const [transactionSheetOpen, setTransactionSheetOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchAccounts();
    fetchExpenses();
    fetchIncomes();
    fetchCategories();
    fetchAllCharges();
    fetchTransfers();
  }, [fetchAccounts, fetchExpenses, fetchIncomes, fetchCategories, fetchAllCharges, fetchTransfers]);

  const { monthStart, monthEnd, monthLabel } = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const start = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const end = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    const monthLabel = selectedDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    return { monthStart: start, monthEnd: end, monthLabel };
  }, [selectedDate]);

  const handlePrevMonth = () => {
    setSelectedDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const isCurrentMonth = useMemo(() => {
    const now = new Date();
    return selectedDate.getMonth() === now.getMonth() && selectedDate.getFullYear() === now.getFullYear();
  }, [selectedDate]);

  const handleNextMonth = () => {
    setSelectedDate(prev => {
      const next = new Date(prev.getFullYear(), prev.getMonth() + 1, 1);
      const now = new Date();
      const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      if (next > currentMonth) return prev;
      return next;
    });
  };

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
      .sort((a, b) => b.total - a.total);
  }, [expenses, categories, monthStart, monthEnd]);

  const recentTransactions = useMemo(() => {
    const monthExpenses = expenses
      .filter(e => e.transactionDate >= monthStart && e.transactionDate <= monthEnd)
      .map(e => ({
        id: e.id,
        type: 'expense' as const,
        amount: e.amount,
        description: e.description,
        date: e.transactionDate,
        createdAt: e.createdAt,
        category: categories.find(c => c.id === e.categoryId),
      }));

    const monthIncomes = incomes
      .filter(i => i.transactionDate >= monthStart && i.transactionDate <= monthEnd)
      .map(i => ({
        id: i.id,
        type: 'income' as const,
        amount: i.amount,
        description: i.description,
        date: i.transactionDate,
        createdAt: i.createdAt,
        category: undefined,
      }));

    const monthCharges = charges
      .filter(c => c.transactionDate >= monthStart && c.transactionDate <= monthEnd)
      .map(c => ({
        id: c.id,
        type: 'expense' as const,
        amount: c.amount,
        description: c.description,
        date: c.transactionDate,
        createdAt: c.createdAt,
        category: categories.find(cat => cat.id === c.categoryId),
      }));

    const monthTransfers = transfers
      .filter(t => t.transactionDate >= monthStart && t.transactionDate <= monthEnd)
      .map(t => ({
        id: t.id,
        type: 'transfer' as const,
        amount: t.amount,
        description: t.description,
        date: t.transactionDate,
        createdAt: t.createdAt,
        category: undefined,
      }));

    return [...monthExpenses, ...monthIncomes, ...monthCharges, ...monthTransfers]
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
      .slice(0, 5);
  }, [expenses, incomes, charges, transfers, categories, monthStart, monthEnd]);

  const isStoreLoading = accountsLoading || expensesLoading || incomesLoading || categoriesLoading || chargesLoading;

  if (!mounted || isStoreLoading) {
    return (
      <ProtectedRoute>
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[var(--color-text)]">Resumen</h2>
            <Skeleton className="h-8 w-32 rounded-lg" />
          </div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-28 w-full rounded-2xl" />
            ))}
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (accounts.length === 0) {
    return (
      <ProtectedRoute>
        <div className="p-6 flex flex-col items-center justify-center min-h-[70vh] text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--color-surface-alt)] flex items-center justify-center text-[var(--color-text-secondary)] mb-4 border border-[var(--color-border)]">
            <FolderOpenIcon className="w-8 h-8" strokeWidth={1.5} />
          </div>
          <h2 className="text-xl font-bold text-[var(--color-text)] mb-2">¡Bienvenido a Numa!</h2>
          <p className="text-sm text-[var(--color-text-secondary)] max-w-sm mb-6">
            Para comenzar a ver el resumen de tus finanzas y registrar tus movimientos, primero debes crear una cuenta.
          </p>
          <Link href="/accounts" className="flex items-center gap-2 px-5 h-11 bg-[var(--color-primary)] text-white font-medium rounded-xl hover:bg-[var(--color-primary-dark)] transition-colors shadow-sm">
            <PlusIcon className="w-4 h-4" />
            Crear mi primera cuenta
          </Link>
        </div>
      </ProtectedRoute>
    );
  }

  // Prepara los datos del gráfico circular
  const chartData = topCategories.map(tc => ({
    name: tc.category?.name ?? 'Sin categoría',
    value: tc.total,
    color: tc.category?.color ?? 'var(--color-primary)',
  }));

  // Si no hay datos de categorías, mostramos un gráfico de "sin gastos"
  const hasExpenses = chartData.length > 0;
  const pieData = hasExpenses ? chartData : [{ name: 'Sin gastos', value: 1, color: 'var(--color-border)' }];

  return (
    <ProtectedRoute>
      <div className="p-4 space-y-5 pb-10">
        
        {/* Header con filtro de fecha */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-[var(--color-text)]">Resumen</h2>
          <div className="flex items-center gap-1 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-1 shadow-sm">
            <button onClick={handlePrevMonth} className="p-1 hover:bg-[var(--color-surface-alt)] rounded-lg transition-colors text-[var(--color-text-secondary)]">
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-[var(--color-text)] px-1 capitalize min-w-[100px] text-center">
              {monthLabel}
            </span>
            <button onClick={handleNextMonth} disabled={isCurrentMonth}
              className={`p-1 rounded-lg transition-colors ${isCurrentMonth ? 'text-[var(--color-border)] cursor-not-allowed' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)]'}`}>
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Patrimonio Neto */}
        <div className="rounded-3xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-700 p-6 text-white shadow-lg shadow-indigo-500/10">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-75">Patrimonio neto total</p>
          <p className="text-3xl font-extrabold mt-1 tracking-tight">{formatCLP(netWorth)}</p>
        </div>

        {/* Ingresos & Gastos Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--color-text-secondary)]">Ingresos</span>
              <div className="w-7 h-7 rounded-full bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center text-emerald-500">
                <ArrowDownLeftIcon className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-lg font-bold text-emerald-500 tracking-tight">{formatCLP(monthlyIncome)}</p>
            </div>
          </div>

          <div className="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--color-text-secondary)]">Gastos</span>
              <div className="w-7 h-7 rounded-full bg-rose-50 dark:bg-rose-950/20 flex items-center justify-center text-rose-500">
                <ArrowUpRightIcon className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-lg font-bold text-rose-500 tracking-tight">{formatCLP(monthlyExpense)}</p>
            </div>
          </div>
        </div>

        {/* Resumen de gastos - Gráfico Circular */}
        <div className="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] p-5 shadow-sm">
          <h3 className="text-sm font-bold text-[var(--color-text)] mb-4">Resumen de gastos</h3>
          
          <div className="relative h-44 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={hasExpenses ? 2 : 0}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-[10px] uppercase font-bold text-[var(--color-text-secondary)] tracking-wider">Total gastado</span>
              <span className="text-lg font-extrabold text-[var(--color-text)] mt-0.5 tracking-tight">
                {formatCLP(monthlyExpense)}
              </span>
            </div>
          </div>

          {/* Listado de categorías debajo del gráfico */}
          {hasExpenses ? (
            <div className="mt-4 pt-4 border-t border-[var(--color-border)] space-y-2.5">
              {topCategories.map(({ categoryId, total, category }) => {
                const percentage = monthlyExpense > 0 ? Math.round((total / monthlyExpense) * 100) : 0;
                return (
                  <div key={categoryId} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: category?.color ?? 'var(--color-primary)' }}
                      />
                      <span className="text-[var(--color-text)] font-semibold truncate">
                        {category?.name ?? 'Sin categoría'}
                      </span>
                    </div>
                    <span className="text-[var(--color-text-secondary)] font-bold whitespace-nowrap">
                      {formatCLP(total)} <span className="opacity-75 font-medium ml-1">({percentage}%)</span>
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mt-4 pt-4 border-t border-[var(--color-border)] text-center">
              <p className="text-xs text-[var(--color-text-secondary)] font-medium">
                No hay gastos registrados en este período.
              </p>
            </div>
          )}
        </div>

        {/* Últimos Movimientos */}
        <div className="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[var(--color-text)]">Últimos movimientos</h3>
            <Link href="/transactions" className="text-xs font-bold text-[var(--color-primary)] hover:underline">
              Ver todos
            </Link>
          </div>

          {recentTransactions.length === 0 ? (
            <p className="text-xs text-[var(--color-text-secondary)] text-center py-4 font-medium">
              No hay movimientos en este mes.
            </p>
          ) : (
            <div className="divide-y divide-[var(--color-border)]">
              {recentTransactions.map(item => (
                <button
                  key={item.id}
                  onClick={() => setSelectedTx(item)}
                  className="w-full flex items-center gap-3 py-3 first:pt-0 last:pb-0 text-left hover:bg-[var(--color-surface-alt)]/50 transition-colors rounded-lg px-1 -mx-1"
                >
                  <div className="w-10 h-10 rounded-full bg-[var(--color-surface-alt)] flex items-center justify-center text-xl shrink-0">
                    {item.type === 'transfer' ? '🔄' : getCategoryEmoji(item.category?.name ?? (item.type === 'income' ? 'Ingreso' : ''))}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-[var(--color-text)] truncate">{item.description}</p>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 font-medium">
                      {item.type === 'transfer' ? 'Transferencia' : item.category?.name ?? (item.type === 'income' ? 'Ingreso' : 'Sin categoría')}
                    </p>
                  </div>
                  <div className="text-right whitespace-nowrap shrink-0 ml-2">
                    <span className={`text-sm font-extrabold ${
                      item.type === 'expense' ? 'text-rose-500' : item.type === 'transfer' ? 'text-blue-500' : 'text-emerald-500'
                    }`}>
                      {item.type === 'expense' ? '-' : item.type === 'transfer' ? '' : '+'}{formatCLP(item.amount)}
                    </span>
                    <p className="text-[10px] text-[var(--color-text-secondary)] mt-0.5 font-semibold">
                      {new Date(item.date + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* FAB */}
      <button onClick={() => setTransactionSheetOpen(true)}
        className="fixed bottom-28 right-4 z-50 w-14 h-14 rounded-full bg-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-primary)]/30 hover:bg-[var(--color-primary-dark)] transition-all active:scale-95 flex items-center justify-center">
        <PlusIcon className="w-6 h-6" />
      </button>

      <TransactionSheet open={transactionSheetOpen} onClose={() => setTransactionSheetOpen(false)} />

      {/* Sheet de Detalle de Transacción */}
      <Sheet
        open={!!selectedTx}
        onClose={() => setSelectedTx(null)}
        title="Detalle de transacción"
      >
        {selectedTx && (
          <div className="flex flex-col items-center py-4">
            <div className="w-16 h-16 rounded-full bg-[var(--color-surface-alt)] flex items-center justify-center text-4xl shadow-inner mb-4">
              {selectedTx.type === 'transfer' ? '🔄' : getCategoryEmoji(selectedTx.category?.name ?? (selectedTx.type === 'income' ? 'Ingreso' : ''))}
            </div>
            
            <span className={`text-3xl font-extrabold tracking-tight ${
              selectedTx.type === 'expense' ? 'text-rose-500' : selectedTx.type === 'transfer' ? 'text-blue-500' : 'text-emerald-500'
            }`}>
              {selectedTx.type === 'expense' ? '-' : selectedTx.type === 'transfer' ? '' : '+'}{formatCLP(selectedTx.amount)}
            </span>
            
            <h4 className="text-lg font-bold text-[var(--color-text)] mt-1.5">{selectedTx.description}</h4>
            
            <div className="w-full mt-6 rounded-2xl bg-[var(--color-surface-alt)] p-4 border border-[var(--color-border)] space-y-3">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-[var(--color-text-secondary)]">Categoría</span>
                <span className="text-[var(--color-text)]">
                  {selectedTx.type === 'transfer' ? 'Transferencia' : selectedTx.category?.name ?? (selectedTx.type === 'income' ? 'Ingresos' : 'Sin categoría')}
                </span>
              </div>
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-[var(--color-text-secondary)]">Fecha</span>
                <span className="text-[var(--color-text)]">
                  {formatDisplayDate(selectedTx.date)}
                </span>
              </div>
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-[var(--color-text-secondary)]">Tipo</span>
                <span className={selectedTx.type === 'expense' ? 'text-rose-500' : selectedTx.type === 'transfer' ? 'text-blue-500' : 'text-emerald-500'}>
                  {selectedTx.type === 'expense' ? 'Gasto' : selectedTx.type === 'transfer' ? 'Transferencia' : 'Ingreso'}
                </span>
              </div>
            </div>
          </div>
        )}
      </Sheet>
    </ProtectedRoute>
  );
}
