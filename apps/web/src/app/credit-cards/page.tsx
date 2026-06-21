'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Sheet } from '@/components/Sheet';
import { useCreditCardsStore } from '@/store/credit-cards';
import { formatCLP } from '@finance-app/utils';

export default function CreditCardsPage() {
  const { cards, isLoading, fetchCards, createCard } = useCreditCardsStore();
  const [createOpen, setCreateOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [name, setName] = useState('');
  const [limitAmount, setLimitAmount] = useState('');
  const [closingDay, setClosingDay] = useState('');
  const [dueDay, setDueDay] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) { setFormError('El nombre es obligatorio'); return; }
    const limit = Math.round(Number.parseFloat(limitAmount) * 100);
    if (Number.isNaN(limit) || limit < 0) { setFormError('Límite inválido'); return; }
    const closing = Number.parseInt(closingDay, 10);
    if (Number.isNaN(closing) || closing < 1 || closing > 31) { setFormError('Día de cierre inválido (1-31)'); return; }
    const due = Number.parseInt(dueDay, 10);
    if (Number.isNaN(due) || due < 1 || due > 31) { setFormError('Día de vencimiento inválido (1-31)'); return; }

    setFormLoading(true);
    await createCard({ name: name.trim(), limitAmount: limit, closingDay: closing, dueDay: due });
    setFormLoading(false);
    setCreateOpen(false);
    setName('');
    setLimitAmount('');
    setClosingDay('');
    setDueDay('');
  };

  return (
    <ProtectedRoute>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-[var(--color-text)]">Tarjetas de crédito</h2>
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center justify-center w-10 h-10 rounded-lg text-[var(--color-primary)] hover:bg-[var(--color-surface-alt)] transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map(i => <div key={i} className="h-28 rounded-xl bg-[var(--color-surface)] animate-pulse" />)}
          </div>
        ) : cards.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-16 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--color-text-secondary)] mb-4">
              <path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <p className="text-[var(--color-text-secondary)] font-medium">Sin tarjetas</p>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">Agrega tu primera tarjeta</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {cards.map(card => (
              <Link
                key={card.id}
                href={`/credit-cards/${card.id}`}
                className="rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 p-4 text-white hover:opacity-90 transition-opacity"
              >
                <p className="text-sm font-medium opacity-80">{card.name}</p>
                <p className="text-2xl font-bold mt-1">{formatCLP(card.limitAmount)}</p>
                <div className="flex gap-4 mt-2 text-xs opacity-80">
                  <span>Cierre: {card.closingDay}</span>
                  <span>Vence: {card.dueDay}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Sheet open={createOpen} onClose={() => setCreateOpen(false)} title="Nueva tarjeta">
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Nombre</label>
            <input id="name" type="text" value={name} onChange={e => setName(e.target.value)}
              className="w-full h-11 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
              placeholder="Ej: Visa Falabella" />
          </div>
          <div>
            <label htmlFor="limit" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Límite ($)</label>
            <input id="limit" type="number" inputMode="decimal" value={limitAmount} onChange={e => setLimitAmount(e.target.value)}
              className="w-full h-11 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
              placeholder="500000" min="0" />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label htmlFor="closing" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Día de cierre</label>
              <input id="closing" type="number" value={closingDay} onChange={e => setClosingDay(e.target.value)}
                className="w-full h-11 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
                placeholder="15" min="1" max="31" />
            </div>
            <div className="flex-1">
              <label htmlFor="due" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Día de vencimiento</label>
              <input id="due" type="number" value={dueDay} onChange={e => setDueDay(e.target.value)}
                className="w-full h-11 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
                placeholder="10" min="1" max="31" />
            </div>
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
