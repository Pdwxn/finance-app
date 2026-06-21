'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PlusIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Sheet } from '@/components/Sheet';
import { Skeleton } from '@/components/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import { SwipeDeleteAction } from '@/hooks/useSwipeToDelete';
import { useInvestmentsStore } from '@/store/investments';
import { formatCLP } from '@finance-app/utils';

export default function InvestmentsPage() {
  const { investments, isLoading, fetchInvestments, createInvestment, deleteInvestment } = useInvestmentsStore();
  const [createOpen, setCreateOpen] = useState(false);
  const [symbol, setSymbol] = useState('');
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [cost, setCost] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => { fetchInvestments(); }, [fetchInvestments]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!symbol.trim()) { setFormError('El símbolo es obligatorio'); return; }
    if (!name.trim()) { setFormError('El nombre es obligatorio'); return; }
    const qty = Number.parseFloat(quantity);
    if (Number.isNaN(qty) || qty <= 0) { setFormError('Cantidad inválida'); return; }
    const avgCost = Math.round(Number.parseFloat(cost) * 100);
    if (Number.isNaN(avgCost) || avgCost <= 0) { setFormError('Costo inválido'); return; }

    setFormLoading(true);
    await createInvestment({ symbol: symbol.trim(), name: name.trim(), quantity: qty, averageCost: avgCost });
    setFormLoading(false);
    setCreateOpen(false);
    setSymbol('');
    setName('');
    setQuantity('');
    setCost('');
  };

  return (
    <ProtectedRoute>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-[var(--color-text)]">Inversiones</h2>
          <button onClick={() => setCreateOpen(true)}
            className="flex items-center justify-center w-10 h-10 rounded-lg text-[var(--color-primary)] hover:bg-[var(--color-surface-alt)] transition-colors">
            <PlusIcon className="w-5 h-5" />
          </button>
        </div>

        {isLoading ? (
          <Skeleton className="h-24 w-full" count={2} />
        ) : investments.length === 0 ? (
          <EmptyState icon={ArrowTrendingUpIcon} title="Sin inversiones" subtitle="Agrega tu primera inversión" />
        ) : (
          <div className="flex flex-col gap-3">
            {investments.map(inv => {
              const totalCost = Math.round(inv.averageCost * inv.quantity);
              return (
                <div key={inv.id} data-swipe-id={inv.id} className="relative overflow-hidden">
                  <SwipeDeleteAction onDelete={() => deleteInvestment(inv.id)} />
                  <Link key={inv.id} href={`/investments/${inv.id}`}
                    className="relative z-10 block rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4 hover:bg-[var(--color-surface-alt)] transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-[var(--color-text)]">{inv.name}</span>
                        <span className="ml-2 text-xs font-mono text-[var(--color-text-secondary)]">{inv.symbol}</span>
                      </div>
                      <span className="text-base font-semibold text-emerald-500">{formatCLP(totalCost)}</span>
                    </div>
                    <div className="flex gap-3 mt-2 text-xs text-[var(--color-text-secondary)]">
                      <span>{inv.quantity} acc.</span>
                      <span>Costo prom.: {formatCLP(inv.averageCost)}</span>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Sheet open={createOpen} onClose={() => setCreateOpen(false)} title="Nueva inversión">
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Símbolo</label>
            <input type="text" value={symbol} onChange={e => setSymbol(e.target.value)}
              className="w-full h-11 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] uppercase"
              placeholder="AAPL" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Nombre</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              className="w-full h-11 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
              placeholder="Apple Inc." />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Cantidad de acciones</label>
            <input type="number" inputMode="decimal" value={quantity} onChange={e => setQuantity(e.target.value)}
              className="w-full h-11 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
              placeholder="10" min="0" step="0.01" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Costo promedio por acción ($)</label>
            <input type="number" inputMode="decimal" value={cost} onChange={e => setCost(e.target.value)}
              className="w-full h-11 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
              placeholder="15000" min="0" />
          </div>
          {formError && <p className="text-sm text-[var(--color-danger)]">{formError}</p>}
          <button type="submit" disabled={formLoading}
            className="w-full h-11 rounded-lg bg-[var(--color-primary)] text-white font-medium hover:bg-[var(--color-primary-dark)] disabled:opacity-50 transition-colors">
            {formLoading ? 'Guardando…' : 'Crear'}
          </button>
        </form>
      </Sheet>
    </ProtectedRoute>
  );
}
