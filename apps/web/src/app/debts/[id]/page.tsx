'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import { Skeleton } from '@/components/Skeleton';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Sheet } from '@/components/Sheet';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useDebtsStore } from '@/store/debts';
import { useDebtPaymentsStore } from '@/store/debt-payments';
import { useAccountsStore } from '@/store/accounts';
import { useExpensesStore } from '@/store/expenses';
import { useIncomesStore } from '@/store/incomes';
import { useTransfersStore } from '@/store/transfers';
import { formatCLP, toCents } from '@finance-app/utils';

export default function DebtDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { debts, fetchDebts, deleteDebt } = useDebtsStore();
  const { payments, fetchPayments, createPayment } = useDebtPaymentsStore();
  const { accounts, fetchAccounts } = useAccountsStore();
  const { expenses } = useExpensesStore();
  const { incomes } = useIncomesStore();
  const { transfers } = useTransfersStore();

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const debt = debts.find(d => d.id === id);

  const totalPaid = useMemo(
    () => payments.reduce((s, p) => s + p.amount, 0),
    [payments]
  );

  const remaining = debt ? debt.initialAmount - totalPaid : 0;
  const progressPct = debt && debt.initialAmount > 0
    ? Math.min(100, Math.round((totalPaid / debt.initialAmount) * 100))
    : 0;

  useEffect(() => {
    fetchDebts();
    fetchPayments(id);
    fetchAccounts();
  }, [fetchDebts, fetchPayments, fetchAccounts, id]);

  const handleDelete = async () => {
    setFormLoading(true);
    await deleteDebt(id);
    setFormLoading(false);
    router.push('/debts');
  };

  const [paymentAccountId, setPaymentAccountId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const parsed = Number.parseFloat(paymentAmount);
    if (Number.isNaN(parsed) || parsed <= 0) { setFormError('Monto inválido'); return; }
    if (!paymentAccountId) { setFormError('Selecciona una cuenta'); return; }

    const amount = toCents(parsed);

    const account = accounts.find(a => a.id === paymentAccountId);
    if (!account) { setFormError('Cuenta no encontrada'); return; }

    const incomeSum = incomes
      .filter(i => i.accountId === paymentAccountId)
      .reduce((s, i) => s + i.amount, 0);
    const expenseSum = expenses
      .filter(e => e.accountId === paymentAccountId)
      .reduce((s, e) => s + e.amount, 0);
    const transferOut = transfers
      .filter(t => t.fromAccountId === paymentAccountId)
      .reduce((s, t) => s + t.amount, 0);
    const transferIn = transfers
      .filter(t => t.toAccountId === paymentAccountId)
      .reduce((s, t) => s + t.amount, 0);

    const balance = account.initialBalance + incomeSum - expenseSum - transferOut + transferIn;

    if (balance < amount) {
      setFormError(`Saldo insuficiente. Disponible: ${formatCLP(balance)}`);
      return;
    }

    setFormLoading(true);
    await createPayment({ debtId: id, accountId: paymentAccountId, amount, paymentDate });
    setFormLoading(false);
    setFormError(null);
    setPaymentOpen(false);
    setPaymentAccountId('');
    setPaymentAmount('');
    setPaymentDate(new Date().toISOString().slice(0, 10));
  };

  const sortedPayments = useMemo(
    () => [...payments].sort((a, b) => b.paymentDate.localeCompare(a.paymentDate)),
    [payments]
  );

  if (!debt) {
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
          <h2 className="text-xl font-semibold text-[var(--color-text)]">{debt.name}</h2>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-rose-500 to-orange-600 p-5 text-white mb-4">
          <p className="text-sm font-medium opacity-80">Deuda total</p>
          <p className="text-3xl font-bold mt-1">{formatCLP(debt.initialAmount)}</p>
          <div className="flex gap-4 mt-2 text-xs opacity-80">
            <span>Tasa: {debt.interestRate}%</span>
            <span>Desde: {debt.startDate}</span>
          </div>
          <div className="mt-4 pt-4 border-t border-white/20">
            <div className="flex justify-between text-sm">
              <span>Pagado</span>
              <span className="font-semibold">{formatCLP(totalPaid)}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span>Saldo pendiente</span>
              <span className="font-semibold">{formatCLP(Math.max(0, remaining))}</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-xs mb-1">
              <span>Progreso</span>
              <span>{progressPct}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/20 overflow-hidden">
              <div className="h-full rounded-full bg-white transition-all" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <button onClick={() => setPaymentOpen(true)}
            className="flex-1 h-10 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition-colors">
            + Pago
          </button>
        </div>

        <button onClick={() => setDeleteOpen(true)}
          className="w-full h-10 rounded-lg border border-[var(--color-danger)] text-[var(--color-danger)] text-sm font-medium hover:bg-[var(--color-danger)] hover:text-white transition-colors mb-4">
          Eliminar deuda
        </button>

        {sortedPayments.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-text)] mb-2">Pagos</h3>
            <div className="flex flex-col gap-2">
              {sortedPayments.map(p => (
                <div key={p.id} className="flex items-center justify-between rounded-xl bg-[var(--color-surface)] p-3 border border-[var(--color-border)]">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-[var(--color-text-secondary)]">{p.paymentDate}</p>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      {accounts.find(a => a.id === p.accountId)?.name ?? '?'}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-emerald-500 ml-2">{formatCLP(p.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Sheet open={paymentOpen} onClose={() => setPaymentOpen(false)} title="Registrar pago">
        <form onSubmit={handleAddPayment} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Cuenta de origen</label>
            <select value={paymentAccountId} onChange={e => setPaymentAccountId(e.target.value)}
              className="w-full h-11 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]">
              <option value="">Seleccionar cuenta</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Monto ($)</label>
            <input type="number" inputMode="decimal" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)}
              className="w-full h-11 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
              placeholder="50000" min="0" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Fecha de pago</label>
            <input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)}
              className="w-full h-11 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]" />
          </div>
          {formError && <p className="text-sm text-[var(--color-danger)]">{formError}</p>}
          <button type="submit" disabled={formLoading}
            className="w-full h-11 rounded-lg bg-emerald-500 text-white font-medium hover:bg-emerald-600 disabled:opacity-50 transition-colors">
            {formLoading ? 'Guardando…' : 'Registrar pago'}
          </button>
        </form>
      </Sheet>

      <ConfirmDialog
        open={deleteOpen}
        title="Eliminar deuda"
        message={`¿Estás seguro de eliminar "${debt.name}"? Los pagos asociados también se eliminarán.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
        isLoading={formLoading}
      />
    </ProtectedRoute>
  );
}
