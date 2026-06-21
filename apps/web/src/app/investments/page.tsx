'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Sheet } from '@/components/Sheet';
import { useInvestmentsStore } from '@/store/investments';
import { formatCLP } from '@finance-app/utils';

export default function InvestmentsPage() {
  const { investments, isLoading, fetchInvestments, createInvestment } = useInvestmentsStore();
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
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-3">{[1, 2].map(i => <div key={i} className="h-24 rounded-xl bg-[var(--color-surface)] animate-pulse" />)}</div>
        ) : investments.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-16 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--color-text-secondary)] mb-4">
              <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <p className="text-[var(--color-text-secondary)] font-medium">Sin inversiones</p>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">Agrega tu primera inversión</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {investments.map(inv => {
              const totalCost = Math.round(inv.averageCost * inv.quantity);
              return (
                <Link key={inv.id} href={`/investments/${inv.id}`}
                  className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4 hover:bg-[var(--color-surface-alt)] transition-colors">
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
