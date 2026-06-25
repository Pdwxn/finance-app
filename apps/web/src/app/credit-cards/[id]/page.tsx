'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Sheet } from '@/components/Sheet';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useCreditCardsStore } from '@/store/credit-cards';
import { useCardChargesStore } from '@/store/card-charges';
import { useCardPaymentsStore } from '@/store/card-payments';
import { useAccountsStore } from '@/store/accounts';
import { useCategoriesStore } from '@/store/categories';
import { useExpensesStore } from '@/store/expenses';
import { useIncomesStore } from '@/store/incomes';
import { useTransfersStore } from '@/store/transfers';
import { formatCLP, toCents } from '@finance-app/utils';

export default function CardDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { cards, fetchCards, deleteCard } = useCreditCardsStore();
  const { charges, fetchCharges, createCharge } = useCardChargesStore();
  const { payments, fetchPayments, createPayment } = useCardPaymentsStore();
  const { accounts, fetchAccounts } = useAccountsStore();
  const { categories, fetchCategories } = useCategoriesStore();
  const { expenses } = useExpensesStore();
  const { incomes } = useIncomesStore();
  const { transfers } = useTransfersStore();

  const [chargeOpen, setChargeOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const card = cards.find(c => c.id === id);

  const totalCharges = useMemo(
    () => charges.reduce((s, c) => s + c.amount, 0),
    [charges]
  );

  const totalPayments = useMemo(
    () => payments.reduce((s, p) => s + p.amount, 0),
    [payments]
  );

  const balance = totalCharges - totalPayments;
  const available = card ? card.limitAmount - balance : 0;

  useEffect(() => {
    fetchCards();
    fetchCharges(id);
    fetchPayments(id);
    fetchAccounts();
    fetchCategories();
  }, [fetchCards, fetchCharges, fetchPayments, fetchAccounts, fetchCategories, id]);

  const handleDelete = async () => {
    setFormLoading(true);
    await deleteCard(id);
    setFormLoading(false);
    router.push('/credit-cards');
  };

  const [chargeCategoryId, setChargeCategoryId] = useState('');
  const [chargeAmount, setChargeAmount] = useState('');
  const [chargeDescription, setChargeDescription] = useState('');
  const [chargeDate, setChargeDate] = useState(new Date().toISOString().slice(0, 10));

  const handleAddCharge = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Math.round(Number.parseFloat(chargeAmount) * 100);
    if (Number.isNaN(amount) || amount <= 0) return;

    setFormLoading(true);
    await createCharge({
      creditCardId: id,
      categoryId: chargeCategoryId,
      amount,
      description: chargeDescription,
      transactionDate: chargeDate,
    });
    setFormLoading(false);
    setChargeOpen(false);
    setChargeCategoryId('');
    setChargeAmount('');
    setChargeDescription('');
    setChargeDate(new Date().toISOString().slice(0, 10));
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
    await createPayment({
      creditCardId: id,
      accountId: paymentAccountId,
      amount,
      paymentDate,
    });
    setFormLoading(false);
    setFormError(null);
    setPaymentOpen(false);
    setPaymentAccountId('');
    setPaymentAmount('');
    setPaymentDate(new Date().toISOString().slice(0, 10));
  };

  const sortedCharges = useMemo(
    () => [...charges].sort((a, b) => b.transactionDate.localeCompare(a.transactionDate)),
    [charges]
  );

  const sortedPayments = useMemo(
    () => [...payments].sort((a, b) => b.paymentDate.localeCompare(a.paymentDate)),
    [payments]
  );

  if (!card) {
    return (
      <ProtectedRoute>
        <div className="p-4">
          <p className="text-[var(--color-text-secondary)]">Cargando…</p>
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
          <h2 className="text-xl font-semibold text-[var(--color-text)]">{card.name}</h2>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-5 text-white mb-4">
          <p className="text-sm font-medium opacity-80">Límite</p>
          <p className="text-3xl font-bold mt-1">{formatCLP(card.limitAmount)}</p>
          <div className="flex gap-4 mt-2 text-xs opacity-80">
            <span>Cierre: {card.closingDay}</span>
            <span>Vence: {card.dueDay}</span>
          </div>
          <div className="mt-4 pt-4 border-t border-white/20">
            <div className="flex justify-between text-sm">
              <span>Disponible</span>
              <span className="font-semibold">{formatCLP(Math.max(0, available))}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span>Saldo usado</span>
              <span className="font-semibold">{formatCLP(Math.max(0, balance))}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <button onClick={() => setChargeOpen(true)}
            className="flex-1 h-10 rounded-lg bg-[var(--color-primary)] text-white text-sm font-medium hover:bg-[var(--color-primary-dark)] transition-colors">
            + Cargo
          </button>
          <button onClick={() => setPaymentOpen(true)}
            className="flex-1 h-10 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition-colors">
            + Pago
          </button>
        </div>

        <button onClick={() => setDeleteOpen(true)}
          className="w-full h-10 rounded-lg border border-[var(--color-danger)] text-[var(--color-danger)] text-sm font-medium hover:bg-[var(--color-danger)] hover:text-white transition-colors mb-4">
          Eliminar tarjeta
        </button>

        {sortedCharges.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-[var(--color-text)] mb-2">Cargos</h3>
            <div className="flex flex-col gap-2">
              {sortedCharges.map(c => (
                <div key={c.id} className="flex items-center justify-between rounded-xl bg-[var(--color-surface)] p-3 border border-[var(--color-border)]">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[var(--color-text)] truncate">{c.description}</p>
                    <p className="text-xs text-[var(--color-text-secondary)]">{c.transactionDate}</p>
                  </div>
                  <span className="text-sm font-semibold text-rose-500 ml-2">{formatCLP(c.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {sortedPayments.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-text)] mb-2">Pagos</h3>
            <div className="flex flex-col gap-2">
              {sortedPayments.map(p => (
                <div key={p.id} className="flex items-center justify-between rounded-xl bg-[var(--color-surface)] p-3 border border-[var(--color-border)]">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[var(--color-text)] truncate">
                      Pago desde {accounts.find(a => a.id === p.accountId)?.name ?? '?'}
                    </p>
                    <p className="text-xs text-[var(--color-text-secondary)]">{p.paymentDate}</p>
                  </div>
                  <span className="text-sm font-semibold text-emerald-500 ml-2">{formatCLP(p.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Sheet open={chargeOpen} onClose={() => setChargeOpen(false)} title="Agregar cargo">
        <form onSubmit={handleAddCharge} className="flex flex-col gap-4">
          <div>
            <label htmlFor="cat" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Categoría</label>
            <select id="cat" value={chargeCategoryId} onChange={e => setChargeCategoryId(e.target.value)}
              className="w-full h-11 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]">
              <option value="">Sin categoría</option>
              {categories.filter(c => c.type === 'expense').map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="amt" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Monto ($)</label>
            <input id="amt" type="number" inputMode="decimal" value={chargeAmount} onChange={e => setChargeAmount(e.target.value)}
              className="w-full h-11 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
              placeholder="25000" min="0" />
          </div>
          <div>
            <label htmlFor="desc" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Descripción</label>
            <input id="desc" type="text" value={chargeDescription} onChange={e => setChargeDescription(e.target.value)}
              className="w-full h-11 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
              placeholder="Ej: Compras supermercado" />
          </div>
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Fecha</label>
            <input id="date" type="date" value={chargeDate} onChange={e => setChargeDate(e.target.value)}
              className="w-full h-11 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]" />
          </div>
          <button type="submit" disabled={formLoading}
            className="w-full h-11 rounded-lg bg-[var(--color-primary)] text-white font-medium hover:bg-[var(--color-primary-dark)] disabled:opacity-50 transition-colors">
            {formLoading ? 'Guardando…' : 'Agregar cargo'}
          </button>
        </form>
      </Sheet>

      <Sheet open={paymentOpen} onClose={() => setPaymentOpen(false)} title="Registrar pago">
        <form onSubmit={handleAddPayment} className="flex flex-col gap-4">
          <div>
            <label htmlFor="acct" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Cuenta de origen</label>
            <select id="acct" value={paymentAccountId} onChange={e => setPaymentAccountId(e.target.value)}
              className="w-full h-11 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]">
              <option value="">Seleccionar cuenta</option>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="pamt" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Monto ($)</label>
            <input id="pamt" type="number" inputMode="decimal" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)}
              className="w-full h-11 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
              placeholder="50000" min="0" />
          </div>
          <div>
            <label htmlFor="pdate" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Fecha de pago</label>
            <input id="pdate" type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)}
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
        title="Eliminar tarjeta"
        message={`¿Estás seguro de eliminar "${card.name}"? Los cargos y pagos asociados también se eliminarán.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
        isLoading={formLoading}
      />
    </ProtectedRoute>
  );
}
