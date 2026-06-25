'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { PlusIcon, FolderOpenIcon } from '@heroicons/react/24/outline';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Sheet } from '@/components/Sheet';
import { Skeleton } from '@/components/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import { AccountForm } from '@/components/AccountForm';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { SwipeDeleteAction } from '@/hooks/useSwipeToDelete';
import { useAccountsStore } from '@/store/accounts';
import { useExpensesStore } from '@/store/expenses';
import { useIncomesStore } from '@/store/incomes';
import { useTransfersStore } from '@/store/transfers';
import { formatCLP } from '@finance-app/utils';
import type { Account } from '@finance-app/types';

export default function AccountsPage() {
  const { accounts, isLoading, fetchAccounts, createAccount, updateAccount, deleteAccount } = useAccountsStore();
  const { expenses, fetchExpenses } = useExpensesStore();
  const { incomes, fetchIncomes } = useIncomesStore();
  const { transfers, fetchTransfers } = useTransfersStore();
  const [createOpen, setCreateOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<string | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchAccounts();
    fetchExpenses();
    fetchIncomes();
    fetchTransfers();
  }, [fetchAccounts, fetchExpenses, fetchIncomes, fetchTransfers]);

  const handleCreate = useCallback(async (data: { name: string; type: Account['type']; currency: string; initialBalance: number }) => {
    setFormLoading(true);
    await createAccount(data);
    setFormLoading(false);
    setCreateOpen(false);
  }, [createAccount]);

  const handleUpdate = useCallback(async (data: { name: string; type: Account['type']; currency: string; initialBalance: number }) => {
    if (!editingAccount) return;
    setFormLoading(true);
    await updateAccount(editingAccount, data);
    setFormLoading(false);
    setEditingAccount(null);
  }, [editingAccount, updateAccount]);

  const handleDelete = useCallback(async () => {
    if (!deletingAccount) return;
    setFormLoading(true);
    await deleteAccount(deletingAccount);
    setFormLoading(false);
    setDeletingAccount(null);
  }, [deletingAccount, deleteAccount]);

  const editAccount = accounts.find(a => a.id === editingAccount);
  const deleteAccountData = accounts.find(a => a.id === deletingAccount);

  const accountBalances = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of accounts) {
      const incomeSum = incomes.filter(i => i.accountId === a.id).reduce((s, i) => s + i.amount, 0);
      const expenseSum = expenses.filter(e => e.accountId === a.id).reduce((s, e) => s + e.amount, 0);
      const transferInSum = transfers.filter(t => t.toAccountId === a.id).reduce((s, t) => s + t.amount, 0);
      const transferOutSum = transfers.filter(t => t.fromAccountId === a.id).reduce((s, t) => s + t.amount, 0);
      map.set(a.id, a.initialBalance + incomeSum - expenseSum + transferInSum - transferOutSum);
    }
    return map;
  }, [accounts, incomes, expenses, transfers]);

  return (
    <ProtectedRoute>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-[var(--color-text)]">Cuentas</h2>
          <button onClick={() => setCreateOpen(true)}
            className="flex items-center justify-center w-10 h-10 rounded-lg text-[var(--color-primary)] hover:bg-[var(--color-surface-alt)] transition-colors">
            <PlusIcon className="w-5 h-5" />
          </button>
        </div>

        {isLoading ? (
          <Skeleton className="h-20 w-full" count={3} />
        ) : accounts.length === 0 ? (
          <EmptyState icon={FolderOpenIcon} title="No tienes cuentas" subtitle="Crea tu primera cuenta para empezar" />
        ) : (
          <div className="flex flex-col gap-3">
            {accounts.map(account => (
              <div key={account.id} data-swipe-id={account.id} className="relative overflow-hidden">
                <SwipeDeleteAction onDelete={() => setDeletingAccount(account.id)} />
                <Link href={`/accounts/${account.id}`}
                  className="relative z-10 flex items-center justify-between rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4 hover:bg-[var(--color-surface-alt)] transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-[var(--color-text)] truncate">{account.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)]">
                        {account.type === 'checking' ? 'Corriente' : account.type === 'savings' ? 'Ahorro' : account.type === 'cash' ? 'Efectivo' : account.type}
                      </span>
                      <span className="text-xs text-[var(--color-text-secondary)]">{account.currency}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <span className="text-base font-semibold text-[var(--color-text)]">{formatCLP(accountBalances.get(account.id) ?? account.initialBalance)}</span>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setEditingAccount(account.id);
                      }}
                      className="flex items-center justify-center w-8 h-8 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)] transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      <Sheet open={createOpen} onClose={() => setCreateOpen(false)} title="Nueva cuenta">
        <AccountForm onSubmit={handleCreate} onCancel={() => setCreateOpen(false)} isLoading={formLoading} />
      </Sheet>

      <Sheet open={!!editingAccount} onClose={() => setEditingAccount(null)} title="Editar cuenta">
        {editAccount && (
          <AccountForm
            initial={editAccount}
            onSubmit={handleUpdate}
            onCancel={() => setEditingAccount(null)}
            isLoading={formLoading}
          />
        )}
      </Sheet>

      <ConfirmDialog
        open={!!deletingAccount}
        title="Eliminar cuenta"
        message={`¿Estás seguro de eliminar "${deleteAccountData?.name ?? ''}"? Esta acción no se puede deshacer.`}
        onConfirm={handleDelete}
        onCancel={() => setDeletingAccount(null)}
        isLoading={formLoading}
      />
    </ProtectedRoute>
  );
}
