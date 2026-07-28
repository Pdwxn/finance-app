'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import {
  CalendarDaysIcon,
  CalendarIcon,
  SparklesIcon,
  TrashIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { useReportsStore } from '@/store/reports';
import { formatDate } from '@finance-app/utils';
import type { ReportType } from '@finance-app/types';

const TABS: Array<{ key: ReportType | 'all'; label: string }> = [
  { key: 'all', label: 'Todos' },
  { key: 'weekly', label: 'Semanales' },
  { key: 'monthly', label: 'Mensuales' },
];

export default function AiReportsPage() {
  const { reports, isLoading, isGenerating, error, fetchReports, generateReport, deleteReport } = useReportsStore();
  const [activeTab, setActiveTab] = useState<ReportType | 'all'>('all');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchReports();
  }, [fetchReports]);

  const filtered = activeTab === 'all'
    ? reports
    : reports.filter(r => r.type === activeTab);

  if (!mounted) return null;

  return (
    <ProtectedRoute>
      <div className="p-4 space-y-4 pb-10">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-[var(--color-text)]">Resúmenes IA</h2>
          <button
            onClick={() => generateReport('weekly')}
            disabled={isGenerating}
            className="flex items-center gap-1.5 px-3 h-9 bg-gradient-to-r from-violet-500 to-purple-600 text-white text-xs font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 shadow-sm"
          >
            <SparklesIcon className="w-4 h-4" />
            {isGenerating ? 'Generando...' : 'Generar'}
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 p-3">
            <ExclamationCircleIcon className="w-4 h-4 text-rose-500 shrink-0" />
            <span className="text-xs font-medium text-rose-600 dark:text-rose-400">{error}</span>
          </div>
        )}

        <div className="flex gap-1.5">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 h-8 text-xs font-bold rounded-lg transition-colors ${
                activeTab === tab.key
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:bg-[var(--color-surface-alt)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4 space-y-2 animate-pulse">
                <div className="h-4 bg-[var(--color-surface-alt)] rounded w-2/3" />
                <div className="h-3 bg-[var(--color-surface-alt)] rounded w-full" />
                <div className="h-3 bg-[var(--color-surface-alt)] rounded w-4/5" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-full bg-[var(--color-surface-alt)] border border-[var(--color-border)] flex items-center justify-center mb-4">
              <SparklesIcon className="w-7 h-7 text-[var(--color-text-secondary)]" />
            </div>
            <p className="text-sm font-bold text-[var(--color-text)] mb-1">Sin resúmenes aún</p>
            <p className="text-xs text-[var(--color-text-secondary)] max-w-xs">
              Los resúmenes se generan automáticamente cada lunes y al inicio de cada mes. También puedes generarlos manualmente.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(report => (
              <Link
                key={report.id}
                href={`/reports/ai/${report.id}`}
                className="block rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4 hover:bg-[var(--color-surface-alt)] transition-colors shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    report.type === 'weekly'
                      ? 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500'
                      : 'bg-purple-50 dark:bg-purple-950/20 text-purple-500'
                  }`}>
                    {report.type === 'weekly'
                      ? <CalendarDaysIcon className="w-5 h-5" />
                      : <CalendarIcon className="w-5 h-5" />
                    }
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[var(--color-text)] truncate">
                        {report.title}
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                        report.type === 'weekly'
                          ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                          : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                      }`}>
                        {report.type === 'weekly' ? 'Semanal' : 'Mensual'}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-1 line-clamp-2 leading-relaxed">
                      {report.summary}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] text-[var(--color-text-tertiary)] font-medium">
                        {formatDate(report.createdAt.slice(0, 10))}
                      </span>
                      <button
                        onClick={e => {
                          e.preventDefault();
                          if (confirm('¿Eliminar este reporte?')) deleteReport(report.id);
                        }}
                        className="p-1 rounded-lg text-[var(--color-text-tertiary)] hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
