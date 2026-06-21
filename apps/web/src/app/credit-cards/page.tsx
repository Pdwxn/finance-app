'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PlusIcon, CreditCardIcon } from '@heroicons/react/24/outline';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Sheet } from '@/components/Sheet';
import { Skeleton } from '@/components/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import { SwipeDeleteAction } from '@/hooks/useSwipeToDelete';
import { useCreditCardsStore } from '@/store/credit-cards';
import { formatCLP } from '@finance-app/utils';

export default function CreditCardsPage() {
  const { cards, isLoading, fetchCards, createCard, deleteCard } = useCreditCardsStore();
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [limitAmount, setLimitAmount] = useState('');
  const [closingDay, setClosingDay] = useState('');
  const [dueDay, setDueDay] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => { fetchCards(); }, [fetchCards]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Math.round(Number.parseFloat(limitAmount) * 100);
    if (Number.isNaN(amount) || amount <= 0) return;
    const closing = Number.parseInt(closingDay);
    const due = Number.parseInt(dueDay);
    if (Number.isNaN(closing) || Number.isNaN(due)) return;

    setFormLoading(true);
    await createCard({ name, limitAmount: amount, closingDay: closing, dueDay: due });
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
          <button onClick={() => setCreateOpen(true)}
            className="flex items-center justify-center w-10 h-10 rounded-lg text-[var(--color-primary)] hover:bg-[var(--color-surface-alt)] transition-colors">
            <PlusIcon className="w-5 h-5" />
          </button>
        </div>

        {isLoading ? (
          <Skeleton className="h-28 w-full" count={2} />
        ) : cards.length === 0 ? (
          <EmptyState icon={CreditCardIcon} title="Sin tarjetas" subtitle="Agrega tu primera tarjeta" />
        ) : (
          <div className="flex flex-col gap-3">
            {cards.map(card => (
              <div key={card.id} data-swipe-id={card.id} className="relative overflow-hidden">
                <SwipeDeleteAction onDelete={() => deleteCard(card.id)} />
                <Link href={`/credit-cards/${card.id}`}
                  className="relative z-10 block rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-4 text-white hover:opacity-90 transition-opacity"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{card.name}</span>
                    <span className="text-sm opacity-80">{formatCLP(card.limitAmount)}</span>
                  </div>
                  <div className="flex gap-3 mt-2 text-xs opacity-80">
                    <span>Cierre: {card.closingDay}</span>
                    <span>Vence: {card.dueDay}</span>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      <Sheet open={createOpen} onClose={() => setCreateOpen(false)} title="Nueva tarjeta">
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Nombre</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              className="w-full h-11 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
              placeholder="Ej: Visa Falabella" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Límite ($)</label>
            <input type="number" inputMode="decimal" value={limitAmount} onChange={e => setLimitAmount(e.target.value)}
              className="w-full h-11 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
              placeholder="1000000" min="0" />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Día de cierre</label>
              <input type="number" value={closingDay} onChange={e => setClosingDay(e.target.value)}
                className="w-full h-11 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
                placeholder="15" min="1" max="31" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Día de vencimiento</label>
              <input type="number" value={dueDay} onChange={e => setDueDay(e.target.value)}
                className="w-full h-11 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
                placeholder="10" min="1" max="31" />
            </div>
          </div>
          <button type="submit" disabled={formLoading}
            className="w-full h-11 rounded-lg bg-[var(--color-primary)] text-white font-medium hover:bg-[var(--color-primary-dark)] disabled:opacity-50 transition-colors">
            {formLoading ? 'Guardando…' : 'Crear'}
          </button>
        </form>
      </Sheet>
    </ProtectedRoute>
  );
}
