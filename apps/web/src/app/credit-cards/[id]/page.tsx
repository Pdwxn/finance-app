'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Sheet } from '@/components/Sheet';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useCreditCardsStore } from '@/store/credit-cards';
import { useCardChargesStore } from '@/store/card-charges';
import { useCardChargeInstallmentsStore } from '@/store/card-charge-installments';
import { useCardPaymentsStore } from '@/store/card-payments';
import { useAccountsStore } from '@/store/accounts';
import { useCategoriesStore } from '@/store/categories';
import { useExpensesStore } from '@/store/expenses';
import { useIncomesStore } from '@/store/incomes';
import { useTransfersStore } from '@/store/transfers';
import {
  formatCLP,
  toCents,
  calculateInstallment,
  getStatementPeriod,
  getPeriodYYYYMM,
} from '@finance-app/utils';

const NOW = new Date();

export default function CardDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { cards, fetchCards, deleteCard } = useCreditCardsStore();
  const { charges, fetchCharges, createCharge } = useCardChargesStore();
  const { installments, fetchInstallments } = useCardChargeInstallmentsStore();
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

  // ── Overall balance ──────────────────────────────────────────────────────

  const nonInstallmentCharges = useMemo(
    () => charges.filter(c => !c.isInstallment).reduce((s, c) => s + c.amount, 0),
    [charges]
  );

  const totalInstallmentsAmount = useMemo(
    () => installments.reduce((s, i) => s + i.amount, 0),
    [installments]
  );

  const totalPayments = useMemo(
    () => payments.reduce((s, p) => s + p.amount, 0),
    [payments]
  );

  const balance = nonInstallmentCharges + totalInstallmentsAmount - totalPayments;
  const available = card ? card.limitAmount - balance : 0;

  // ── Statement period ──────────────────────────────────────────────────────

  const period = useMemo(
    () => card ? getStatementPeriod(NOW, card.closingDay, card.dueDay) : null,
    [card],
  );

  const currentPeriodLabel = period?.duePeriod ?? getPeriodYYYYMM(NOW);

  // ── Filtered items ────────────────────────────────────────────────────────

  const regularChargesInPeriod = useMemo(() => {
    if (!period) return [];
    return charges.filter(c =>
      !c.isInstallment
      && c.transactionDate >= period.periodStart
      && c.transactionDate <= period.periodEnd
    );
  }, [charges, period]);

  const installmentsInPeriod = useMemo(
    () => installments.filter(i => i.duePeriod === currentPeriodLabel),
    [installments, currentPeriodLabel],
  );

  const futureInstallments = useMemo(
    () => installments
      .filter(i => i.duePeriod > currentPeriodLabel)
      .sort((a, b) => a.duePeriod.localeCompare(b.duePeriod) || a.installmentNumber - b.installmentNumber),
    [installments, currentPeriodLabel],
  );

  const futureInstallmentsByPeriod = useMemo(() => {
    const map = new Map<string, typeof installments>();
    for (const inst of futureInstallments) {
      const list = map.get(inst.duePeriod) ?? [];
      list.push(inst);
      map.set(inst.duePeriod, list);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [futureInstallments]);

  const monthlyFee = (card?.monthlyFee ?? 0);

  const totalDue = useMemo(
    () => regularChargesInPeriod.reduce((s, c) => s + c.amount, 0)
      + installmentsInPeriod.reduce((s, i) => s + i.amount, 0)
      + monthlyFee,
    [regularChargesInPeriod, installmentsInPeriod, monthlyFee],
  );

  // ── Load data ─────────────────────────────────────────────────────────────

  useEffect(() => {
    fetchCards();
    fetchCharges(id);
    fetchInstallments(id);
    fetchPayments(id);
    fetchAccounts();
    fetchCategories();
  }, [fetchCards, fetchCharges, fetchInstallments, fetchPayments, fetchAccounts, fetchCategories, id]);

  // ── Delete card ───────────────────────────────────────────────────────────

  const handleDelete = async () => {
    setFormLoading(true);
    await deleteCard(id);
    setFormLoading(false);
    router.push('/credit-cards');
  };

  // ── Add charge (with installments) ────────────────────────────────────────

  const [chargeCategoryId, setChargeCategoryId] = useState('');
  const [chargeAmount, setChargeAmount] = useState('');
  const [chargeDescription, setChargeDescription] = useState('');
  const [chargeDate, setChargeDate] = useState(NOW.toISOString().slice(0, 10));
  const [chargeIsInstallment, setChargeIsInstallment] = useState(false);
  const [chargeTotalInstallments, setChargeTotalInstallments] = useState(3);
  const [chargeWithInterest, setChargeWithInterest] = useState(false);

  const chargeAmountCents = useMemo(
    () => Math.round(Number.parseFloat(chargeAmount || '0') * 100),
    [chargeAmount],
  );

  const previewInstallment = useMemo(() => {
    if (!chargeIsInstallment || chargeAmountCents <= 0) return null;
    const rate = chargeWithInterest ? (card?.interestRate ?? null) : null;
    return calculateInstallment(chargeAmountCents, rate, chargeTotalInstallments);
  }, [chargeIsInstallment, chargeAmountCents, chargeWithInterest, card?.interestRate, chargeTotalInstallments]);

  const handleAddCharge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Number.isNaN(chargeAmountCents) || chargeAmountCents <= 0) return;

    setFormLoading(true);
    await createCharge({
      creditCardId: id,
      categoryId: chargeCategoryId,
      amount: chargeAmountCents,
      description: chargeDescription,
      transactionDate: chargeDate,
      isInstallment: chargeIsInstallment,
      totalInstallments: chargeIsInstallment ? chargeTotalInstallments : null,
      installmentAmount: previewInstallment,
      interestRate: chargeWithInterest ? (card?.interestRate ?? null) : null,
    });
    setFormLoading(false);
    setChargeOpen(false);
    setChargeCategoryId('');
    setChargeAmount('');
    setChargeDescription('');
    setChargeDate(NOW.toISOString().slice(0, 10));
    setChargeIsInstallment(false);
    setChargeTotalInstallments(3);
    setChargeWithInterest(false);
  };

  // ── Add payment ───────────────────────────────────────────────────────────

  const [paymentAccountId, setPaymentAccountId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(NOW.toISOString().slice(0, 10));

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const parsed = Number.parseFloat(paymentAmount);
    if (Number.isNaN(parsed) || parsed <= 0) { setFormError('Monto inválido'); return; }
    if (!paymentAccountId) { setFormError('Selecciona una cuenta'); return; }

    const amount = toCents(parsed);
    const account = accounts.find(a => a.id === paymentAccountId);
    if (!account) { setFormError('Cuenta no encontrada'); return; }

    const incomeSum = incomes.filter(i => i.accountId === paymentAccountId).reduce((s, i) => s + i.amount, 0);
    const expenseSum = expenses.filter(e => e.accountId === paymentAccountId).reduce((s, e) => s + e.amount, 0);
    const transferOut = transfers.filter(t => t.fromAccountId === paymentAccountId).reduce((s, t) => s + t.amount, 0);
    const transferIn = transfers.filter(t => t.toAccountId === paymentAccountId).reduce((s, t) => s + t.amount, 0);
    const balance = account.initialBalance + incomeSum - expenseSum - transferOut + transferIn;

    if (balance < amount) {
      setFormError(`Saldo insuficiente. Disponible: ${formatCLP(balance)}`);
      return;
    }

    setFormLoading(true);
    await createPayment({ creditCardId: id, accountId: paymentAccountId, amount, paymentDate });
    setFormLoading(false);
    setFormError(null);
    setPaymentOpen(false);
    setPaymentAccountId('');
    setPaymentAmount('');
    setPaymentDate(NOW.toISOString().slice(0, 10));
  };

  // ── Sorted lists ──────────────────────────────────────────────────────────

  const allChargesSorted = useMemo(
    () => [...charges].sort((a, b) => b.transactionDate.localeCompare(a.transactionDate)),
    [charges],
  );

  const sortedPayments = useMemo(
    () => [...payments].sort((a, b) => b.paymentDate.localeCompare(a.paymentDate)),
    [payments],
  );

  const getChargeName = useCallback((chargeId: string) => {
    return charges.find(c => c.id === chargeId)?.description ?? 'Cargo';
  }, [charges]);

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

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => router.back()} className="flex items-center justify-center w-10 h-10 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)] transition-colors">
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-semibold text-[var(--color-text)]">{card.name}</h2>
        </div>

        {/* ── Card summary ────────────────────────────────────────────── */}
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

        {/* ── Statement section ───────────────────────────────────────── */}
        {period && (
          <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4 mb-4">
            <h3 className="text-sm font-semibold text-[var(--color-text)] mb-1">Estado de cuenta</h3>
            <p className="text-xs text-[var(--color-text-secondary)] mb-3">
              {period.periodStart} → {period.periodEnd}
              <span className="ml-2 font-medium text-[var(--color-primary)]">Vence: {period.dueDate}</span>
            </p>
            <div className="flex flex-col gap-2">
              {regularChargesInPeriod.map(c => (
                <div key={c.id} className="flex items-center justify-between text-sm">
                  <span className="text-[var(--color-text)] truncate">{c.description}</span>
                  <span className="text-rose-500 font-semibold ml-2 shrink-0">{formatCLP(c.amount)}</span>
                </div>
              ))}
              {installmentsInPeriod.map(i => (
                <div key={i.id} className="flex items-center justify-between text-sm">
                  <span className="text-[var(--color-text)] truncate">
                    Cuota {i.installmentNumber}/{charges.find(c => c.id === i.cardChargeId)?.totalInstallments ?? '?'} — {getChargeName(i.cardChargeId)}
                  </span>
                  <span className="text-rose-500 font-semibold ml-2 shrink-0">{formatCLP(i.amount)}</span>
                </div>
              ))}
              {monthlyFee > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--color-text)]">Comisión mensual</span>
                  <span className="text-rose-500 font-semibold ml-2 shrink-0">{formatCLP(monthlyFee)}</span>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between pt-3 mt-3 border-t border-[var(--color-border)]">
              <span className="text-sm font-semibold text-[var(--color-text)]">Total a pagar</span>
              <span className="text-sm font-bold text-rose-600">{formatCLP(totalDue)}</span>
            </div>
          </div>
        )}

        {/* ── Future installments ─────────────────────────────────────── */}
        {futureInstallmentsByPeriod.length > 0 && (
          <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4 mb-4">
            <h3 className="text-sm font-semibold text-[var(--color-text)] mb-3">Próximas cuotas</h3>
            {futureInstallmentsByPeriod.map(([periodLabel, items]) => (
              <div key={periodLabel} className="mb-3 last:mb-0">
                <p className="text-xs font-medium text-[var(--color-text-secondary)] mb-1">{periodLabel}</p>
                {items.map(i => (
                  <div key={i.id} className="flex items-center justify-between text-sm py-1">
                    <span className="text-[var(--color-text)] truncate">
                      Cuota {i.installmentNumber}/{charges.find(c => c.id === i.cardChargeId)?.totalInstallments ?? '?'} — {getChargeName(i.cardChargeId)}
                    </span>
                    <span className="text-rose-500 font-semibold ml-2 shrink-0">{formatCLP(i.amount)}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* ── Buttons ──────────────────────────────────────────────────── */}
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

        {/* ── Delete ──────────────────────────────────────────────────── */}
        <button onClick={() => setDeleteOpen(true)}
          className="w-full h-10 rounded-lg border border-[var(--color-danger)] text-[var(--color-danger)] text-sm font-medium hover:bg-[var(--color-danger)] hover:text-white transition-colors mb-4">
          Eliminar tarjeta
        </button>

        {/* ── All charges ─────────────────────────────────────────────── */}
        {allChargesSorted.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-[var(--color-text)] mb-2">Todos los cargos</h3>
            <div className="flex flex-col gap-2">
              {allChargesSorted.map(c => (
                <div key={c.id} className="flex items-center justify-between rounded-xl bg-[var(--color-surface)] p-3 border border-[var(--color-border)]">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[var(--color-text)] truncate">
                      {c.isInstallment ? `Cuotas (${c.totalInstallments}) — ` : ''}{c.description}
                    </p>
                    <p className="text-xs text-[var(--color-text-secondary)]">{c.transactionDate}</p>
                  </div>
                  <span className="text-sm font-semibold text-rose-500 ml-2">{formatCLP(c.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Payments ────────────────────────────────────────────────── */}
        {sortedPayments.length > 0 && (
          <div className="mb-4">
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

      {/* ── Add Charge Sheet ───────────────────────────────────────────────── */}
      <Sheet open={chargeOpen} onClose={() => setChargeOpen(false)} title="Agregar cargo">
        <form onSubmit={handleAddCharge} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Categoría</label>
            <select value={chargeCategoryId} onChange={e => setChargeCategoryId(e.target.value)}
              className="w-full h-11 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]">
              <option value="">Sin categoría</option>
              {categories.filter(c => c.type === 'expense').map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Monto ($)</label>
            <input type="number" inputMode="decimal" value={chargeAmount} onChange={e => setChargeAmount(e.target.value)}
              className="w-full h-11 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
              placeholder="25000" min="0" />
          </div>

          {/* Installment toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={chargeIsInstallment}
              onChange={e => setChargeIsInstallment(e.target.checked)}
              className="w-4 h-4 rounded border-[var(--color-border)]" />
            <span className="text-sm text-[var(--color-text)]">Pagar en cuotas</span>
          </label>

          {chargeIsInstallment && (
            <>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">N° de cuotas</label>
                <select value={chargeTotalInstallments} onChange={e => setChargeTotalInstallments(Number(e.target.value))}
                  className="w-full h-11 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]">
                  {[2, 3, 4, 6, 8, 10, 12, 18, 24, 36, 48].map(n => (
                    <option key={n} value={n}>{n} cuotas</option>
                  ))}
                </select>
              </div>

              {card?.interestRate && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={chargeWithInterest}
                    onChange={e => setChargeWithInterest(e.target.checked)}
                    className="w-4 h-4 rounded border-[var(--color-border)]" />
                  <span className="text-sm text-[var(--color-text)]">Con interés ({card.interestRate}% mensual)</span>
                </label>
              )}

              {previewInstallment !== null && (
                <p className="text-sm text-[var(--color-primary)] font-medium">
                  Cuota aprox: {formatCLP(previewInstallment)}
                </p>
              )}
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Descripción</label>
            <input type="text" value={chargeDescription} onChange={e => setChargeDescription(e.target.value)}
              className="w-full h-11 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
              placeholder="Ej: Compras supermercado" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Fecha</label>
            <input type="date" value={chargeDate} onChange={e => setChargeDate(e.target.value)}
              className="w-full h-11 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]" />
          </div>
          <button type="submit" disabled={formLoading}
            className="w-full h-11 rounded-lg bg-[var(--color-primary)] text-white font-medium hover:bg-[var(--color-primary-dark)] disabled:opacity-50 transition-colors">
            {formLoading ? 'Guardando…' : 'Agregar cargo'}
          </button>
        </form>
      </Sheet>

      {/* ── Add Payment Sheet ──────────────────────────────────────────────── */}
      <Sheet open={paymentOpen} onClose={() => setPaymentOpen(false)} title="Registrar pago">
        <form onSubmit={handleAddPayment} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Cuenta de origen</label>
            <select value={paymentAccountId} onChange={e => setPaymentAccountId(e.target.value)}
              className="w-full h-11 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]">
              <option value="">Seleccionar cuenta</option>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
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

      {/* ── Confirm Delete ─────────────────────────────────────────────────── */}
      <ConfirmDialog
        open={deleteOpen}
        title="Eliminar tarjeta"
        message={`¿Estás seguro de eliminar "${card.name}"? Los cargos, cuotas y pagos asociados también se eliminarán.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
        isLoading={formLoading}
      />
    </ProtectedRoute>
  );
}
