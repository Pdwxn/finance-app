'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import { Skeleton } from '@/components/Skeleton';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Sheet } from '@/components/Sheet';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useInvestmentsStore } from '@/store/investments';
import { useInvestmentTransactionsStore } from '@/store/investment-transactions';
import { formatCLP } from '@finance-app/utils';

export default function InvestmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { investments, fetchInvestments, deleteInvestment } = useInvestmentsStore();
  const { transactions, fetchTransactions, createTransaction } = useInvestmentTransactionsStore();

  const [txOpen, setTxOpen] = useState(false);
  const [txType, setTxType] = useState<'buy' | 'sell'>('buy');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const investment = investments.find(i => i.id === id);

  useEffect(() => {
    fetchInvestments();
    fetchTransactions(id);
  }, [fetchInvestments, fetchTransactions, id]);

  const handleDelete = async () => {
    setFormLoading(true);
    await deleteInvestment(id);
    setFormLoading(false);
    router.push('/investments');
  };

  const [txQuantity, setTxQuantity] = useState('');
  const [txPrice, setTxPrice] = useState('');
  const [txDate, setTxDate] = useState(new Date().toISOString().slice(0, 10));

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const qty = Number.parseFloat(txQuantity);
    if (Number.isNaN(qty) || qty <= 0) { setFormError('Cantidad inválida'); return; }
    const price = Math.round(Number.parseFloat(txPrice) * 100);
    if (Number.isNaN(price) || price <= 0) { setFormError('Precio inválido'); return; }

    setFormLoading(true);
    await createTransaction({
      investmentId: id,
      type: txType,
      quantity: qty,
      price,
      transactionDate: txDate,
    });
    setFormLoading(false);
    setTxOpen(false);
    setTxQuantity('');
    setTxPrice('');
    setTxDate(new Date().toISOString().slice(0, 10));
  };

  const sortedTransactions = useMemo(
    () => [...transactions].sort((a, b) => b.transactionDate.localeCompare(a.transactionDate)),
    [transactions]
  );

  if (!investment) {
    return (
      <ProtectedRoute>
        <div className="p-4">
          <p className="text-[var(--color-text-secondary)]">Cargando…</p>
          <Skeleton className="h-40 w-full mt-4" />
        </div>
      </ProtectedRoute>
    );
  }

  const totalCost = Math.round(investment.averageCost * investment.quantity);

  return (
    <ProtectedRoute>
      <div className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => router.back()} className="flex items-center justify-center w-10 h-10 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)] transition-colors">
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-semibold text-[var(--color-text)]">{investment.name}</h2>
            <p className="text-xs font-mono text-[var(--color-text-secondary)]">{investment.symbol}</p>
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-5 text-white mb-4">
          <p className="text-sm font-medium opacity-80">Valor total</p>
          <p className="text-3xl font-bold mt-1">{formatCLP(totalCost)}</p>
          <div className="flex gap-4 mt-2 text-xs opacity-80">
            <span>{investment.quantity} acciones</span>
            <span>Costo prom.: {formatCLP(investment.averageCost)}</span>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <button onClick={() => { setTxType('buy'); setTxOpen(true); }}
            className="flex-1 h-10 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition-colors">
            + Compra
          </button>
          <button onClick={() => { setTxType('sell'); setTxOpen(true); }}
            className="flex-1 h-10 rounded-lg bg-rose-500 text-white text-sm font-medium hover:bg-rose-600 transition-colors">
            - Venta
          </button>
        </div>

        <button onClick={() => setDeleteOpen(true)}
          className="w-full h-10 rounded-lg border border-[var(--color-danger)] text-[var(--color-danger)] text-sm font-medium hover:bg-[var(--color-danger)] hover:text-white transition-colors mb-4">
          Eliminar inversión
        </button>

        {sortedTransactions.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-text)] mb-2">Transacciones</h3>
            <div className="flex flex-col gap-2">
              {sortedTransactions.map(t => (
                <div key={t.id} className="flex items-center justify-between rounded-xl bg-[var(--color-surface)] p-3 border border-[var(--color-border)]">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                        t.type === 'buy'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400'
                      }`}>
                        {t.type === 'buy' ? 'COMPRA' : 'VENTA'}
                      </span>
                      <span className="text-xs text-[var(--color-text-secondary)]">{t.transactionDate}</span>
                    </div>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                      {t.quantity} acc. × {formatCLP(t.price)}
                    </p>
                  </div>
                  <span className={`text-sm font-semibold ml-2 ${
                    t.type === 'buy' ? 'text-emerald-500' : 'text-rose-500'
                  }`}>
                    {formatCLP(Math.round(t.quantity * t.price))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Sheet open={txOpen} onClose={() => setTxOpen(false)} title={txType === 'buy' ? 'Registrar compra' : 'Registrar venta'}>
        <form onSubmit={handleCreateTransaction} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Cantidad de acciones</label>
            <input type="number" inputMode="decimal" value={txQuantity} onChange={e => setTxQuantity(e.target.value)}
              className="w-full h-11 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
              placeholder="5" min="0" step="0.01" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Precio por acción ($)</label>
            <input type="number" inputMode="decimal" value={txPrice} onChange={e => setTxPrice(e.target.value)}
              className="w-full h-11 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
              placeholder="25000" min="0" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Fecha</label>
            <input type="date" value={txDate} onChange={e => setTxDate(e.target.value)}
              className="w-full h-11 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]" />
          </div>
          {formError && <p className="text-sm text-[var(--color-danger)]">{formError}</p>}
          <button type="submit" disabled={formLoading}
            className="w-full h-11 rounded-lg bg-[var(--color-primary)] text-white font-medium hover:bg-[var(--color-primary-dark)] disabled:opacity-50 transition-colors">
            {formLoading ? 'Guardando…' : txType === 'buy' ? 'Registrar compra' : 'Registrar venta'}
          </button>
        </form>
      </Sheet>

      <ConfirmDialog
        open={deleteOpen}
        title="Eliminar inversión"
        message={`¿Estás seguro de eliminar "${investment.name}"? Las transacciones asociadas también se eliminarán.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
        isLoading={formLoading}
      />
    </ProtectedRoute>
  );
}
