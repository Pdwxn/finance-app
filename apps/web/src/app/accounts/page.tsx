'use client';

import { useEffect } from 'react';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { useAccountsStore } from '../../store/accounts';
import { formatCLP } from '@finance-app/utils';

const typeLabels: Record<string, string> = {
  cash: 'Efectivo',
  checking: 'Corriente',
  savings: 'Ahorro',
  investment: 'Inversión',
  credit: 'Crédito',
};

const typeColors: Record<string, string> = {
  cash: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  checking: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  savings: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  investment: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  credit: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
};

export default function AccountsPage() {
  const { accounts, isLoading, error, fetchAccounts } = useAccountsStore();

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  return (
    <ProtectedRoute>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-[var(--color-text)]">Cuentas</h2>
          <button className="flex items-center justify-center w-10 h-10 rounded-lg text-[var(--color-primary)] hover:bg-[var(--color-surface-alt)] transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>

        {error && (
          <p className="text-sm text-[var(--color-danger)] mb-4">{error}</p>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 rounded-xl bg-[var(--color-surface)] animate-pulse" />
            ))}
          </div>
        ) : accounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-16 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--color-text-secondary)] mb-4">
              <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <p className="text-[var(--color-text-secondary)] font-medium">No tienes cuentas</p>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">Crea tu primera cuenta para empezar</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {accounts.map(account => (
              <div
                key={account.id}
                className="flex items-center justify-between rounded-xl bg-[var(--color-surface)] p-4 border border-[var(--color-border)]"
              >
                <div className="flex flex-col gap-1.5">
                  <span className="font-medium text-[var(--color-text)]">{account.name}</span>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${typeColors[account.type] ?? 'bg-gray-100 text-gray-700'}`}>
                      {typeLabels[account.type] ?? account.type}
                    </span>
                    <span className="text-[11px] text-[var(--color-text-secondary)] uppercase">{account.currency}</span>
                  </div>
                </div>
                <span className="text-base font-semibold text-[var(--color-text)]">
                  {formatCLP(account.initialBalance)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
