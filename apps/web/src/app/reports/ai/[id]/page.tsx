'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Skeleton } from '@/components/Skeleton';
import {
  CalendarDaysIcon,
  CalendarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
} from '@heroicons/react/24/outline';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { apiGet } from '@/lib/api';
import { formatCurrency, formatDate } from '@finance-app/utils';
import type { FinancialReport } from '@finance-app/types';

export default function AiReportDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [report, setReport] = useState<FinancialReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      const res = await apiGet<FinancialReport>(`/api/reports/${id}`);
      if (res.success && res.data) {
        setReport(res.data);
      }
      setIsLoading(false);
    }
    load();
  }, [id]);

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="p-4 space-y-4">
          <Skeleton className="h-6 w-2/3 rounded-lg" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      </ProtectedRoute>
    );
  }

  if (!report) {
    return (
      <ProtectedRoute>
        <div className="p-4 text-center py-16">
          <p className="text-sm text-[var(--color-text-secondary)] font-medium">Reporte no encontrado</p>
        </div>
      </ProtectedRoute>
    );
  }

  const { metadata } = report;
  const currency = metadata.currency;

  const chartData = metadata.expenseByCategory.map(c => ({
    name: c.name,
    value: c.amount,
    percentage: c.percentage,
  }));

  const hasExpenses = chartData.length > 0;

  return (
    <ProtectedRoute>
      <div className="p-4 space-y-5 pb-10">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            report.type === 'weekly'
              ? 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500'
              : 'bg-purple-50 dark:bg-purple-950/20 text-purple-500'
          }`}>
            {report.type === 'weekly'
              ? <CalendarDaysIcon className="w-6 h-6" />
              : <CalendarIcon className="w-6 h-6" />
            }
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[var(--color-text)]">{report.title}</h2>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                report.type === 'weekly'
                  ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                  : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
              }`}>
                {report.type === 'weekly' ? 'Semanal' : 'Mensual'}
              </span>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
              Generado el {formatDate(report.createdAt.slice(0, 10))}
            </p>
          </div>
        </div>

        {/* Summary Card */}
        <div className="rounded-3xl bg-gradient-to-br from-violet-500 via-purple-600 to-fuchsia-700 p-5 text-white shadow-lg shadow-purple-500/10">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-75 mb-2">
            Resumen {report.type === 'weekly' ? 'semanal' : 'mensual'}
          </p>
          <p className="text-sm leading-relaxed opacity-95">{report.summary}</p>
        </div>

        {/* Financial Overview Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4 shadow-sm">
            <span className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">Ingresos</span>
            <p className="text-lg font-extrabold text-emerald-500 mt-1">{formatCurrency(metadata.totalIncome, currency)}</p>
          </div>
          <div className="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4 shadow-sm">
            <span className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">Gastos</span>
            <p className="text-lg font-extrabold text-rose-500 mt-1">{formatCurrency(metadata.totalExpenses, currency)}</p>
          </div>
          <div className="col-span-2 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4 shadow-sm">
            <span className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">Balance neto</span>
            <p className={`text-xl font-extrabold mt-1 ${
              metadata.netBalance >= 0 ? 'text-emerald-500' : 'text-rose-500'
            }`}>
              {formatCurrency(metadata.netBalance, currency)}
            </p>
          </div>
        </div>

        {/* Comparison Card */}
        {metadata.comparisonPrevious && (
          <div className="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-[var(--color-text)]">Comparativa con período anterior</h3>
            <div className="space-y-2">
              <ComparisonRow
                label="Ingresos"
                value={metadata.comparisonPrevious.incomeChange}
              />
              <ComparisonRow
                label="Gastos"
                value={metadata.comparisonPrevious.expensesChange}
                invert
              />
              <ComparisonRow
                label="Balance"
                value={metadata.comparisonPrevious.balanceChange}
              />
            </div>
          </div>
        )}

        {/* Pie Chart */}
        {hasExpenses && (
          <div className="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] p-5 shadow-sm">
            <h3 className="text-sm font-bold text-[var(--color-text)] mb-4">Gastos por categoría</h3>
            <div className="relative h-44 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.percentage > 0 ? undefined : 'var(--color-border)'} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-[10px] uppercase font-bold text-[var(--color-text-secondary)] tracking-wider">Total</span>
                <span className="text-base font-extrabold text-[var(--color-text)] mt-0.5">
                  {formatCurrency(metadata.totalExpenses, currency)}
                </span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-[var(--color-border)] space-y-2.5">
              {metadata.expenseByCategory.map(c => (
                <div key={c.categoryId} className="flex items-center justify-between text-xs">
                  <span className="text-[var(--color-text)] font-semibold">{c.name}</span>
                  <span className="text-[var(--color-text-secondary)] font-bold">
                    {formatCurrency(c.amount, currency)} ({c.percentage}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Budgets at Risk */}
        {metadata.budgetsAtRisk.length > 0 && (
          <div className="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-[var(--color-text)]">Presupuestos en riesgo</h3>
            {metadata.budgetsAtRisk.map(b => {
              const pct = Math.round((b.used / b.limit) * 100);
              return (
                <div key={b.categoryId}>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-[var(--color-text)] font-semibold">{b.name}</span>
                    <span className="text-[var(--color-text-secondary)] font-bold">
                      {formatCurrency(b.used, currency)} / {formatCurrency(b.limit, currency)}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[var(--color-surface)] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: pct >= 100 ? 'var(--color-danger)' : '#eab308',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Top Expenses */}
        {metadata.topExpenses.length > 0 && (
          <div className="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-[var(--color-text)]">Top gastos</h3>
            <div className="space-y-2">
              {metadata.topExpenses.map((e, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="min-w-0 flex-1">
                    <span className="text-[var(--color-text)] font-semibold truncate block">{e.description}</span>
                    <span className="text-[var(--color-text-tertiary)]">{e.category}</span>
                  </div>
                  <span className="text-rose-500 font-bold shrink-0 ml-2">{formatCurrency(e.amount, currency)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </ProtectedRoute>
  );
}

function ComparisonRow({ label, value, invert }: { label: string; value: number; invert?: boolean }) {
  const absValue = Math.abs(value);
  const isPositive = value > 0;
  const isNegative = value < 0;

  let arrowColor: string;
  let Icon: typeof ArrowTrendingUpIcon;

  if (invert) {
    arrowColor = isNegative ? 'text-emerald-500' : isPositive ? 'text-rose-500' : 'text-[var(--color-text-secondary)]';
    Icon = isPositive ? ArrowTrendingUpIcon : isNegative ? ArrowTrendingDownIcon : MinusIcon;
  } else {
    arrowColor = isPositive ? 'text-emerald-500' : isNegative ? 'text-rose-500' : 'text-[var(--color-text-secondary)]';
    Icon = isPositive ? ArrowTrendingUpIcon : isNegative ? ArrowTrendingDownIcon : MinusIcon;
  }

  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-[var(--color-text-secondary)] font-medium">{label}</span>
      <div className={`flex items-center gap-1 text-xs font-bold ${arrowColor}`}>
        <Icon className="w-3.5 h-3.5" />
        <span>{value > 0 ? '+' : ''}{absValue.toFixed(1)}%</span>
      </div>
    </div>
  );
}
