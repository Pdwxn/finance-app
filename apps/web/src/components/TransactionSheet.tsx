'use client';

import { useState } from 'react';
import { Sheet } from '@/components/Sheet';
import { useAccountsStore } from '@/store/accounts';
import { useCategoriesStore } from '@/store/categories';
import { useExpensesStore } from '@/store/expenses';
import { useIncomesStore } from '@/store/incomes';
import { useTransfersStore } from '@/store/transfers';
import { toCents } from '@finance-app/utils';

type TransactionType = 'expense' | 'income' | 'transfer';

interface TransactionSheetProps {
  open: boolean;
  onClose: () => void;
}

export function TransactionSheet({ open, onClose }: TransactionSheetProps) {
  const { accounts } = useAccountsStore();
  const { categories } = useCategoriesStore();
  const { createExpense } = useExpensesStore();
  const { createIncome } = useIncomesStore();
  const { createTransfer } = useTransfersStore();

  const [type, setType] = useState<TransactionType>('expense');
  const [accountId, setAccountId] = useState('');
  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const resetForm = () => {
    setType('expense');
    setAccountId('');
    setFromAccountId('');
    setToAccountId('');
    setCategoryId('');
    setAmount('');
    setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
    setFormError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const filteredCategories = categories.filter(c =>
    type === 'expense' ? c.type === 'expense' : c.type === 'income'
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const parsedAmount = Number.parseFloat(amount);
    if (!amount || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError('El monto debe ser mayor a 0');
      return;
    }
    if (!description.trim()) {
      setFormError('La descripción es obligatoria');
      return;
    }
    if (!date) {
      setFormError('La fecha es obligatoria');
      return;
    }

    if (type === 'transfer') {
      if (!fromAccountId) { setFormError('Selecciona la cuenta origen'); return; }
      if (!toAccountId) { setFormError('Selecciona la cuenta destino'); return; }
      if (fromAccountId === toAccountId) { setFormError('Las cuentas deben ser diferentes'); return; }
    } else {
      if (!accountId) { setFormError('Selecciona una cuenta'); return; }
      if (!categoryId) { setFormError('Selecciona una categoría'); return; }
    }

    const amountInCents = toCents(parsedAmount);

    setFormLoading(true);
    try {
      if (type === 'expense') {
        await createExpense({
          accountId,
          categoryId,
          amount: amountInCents,
          description: description.trim(),
          transactionDate: date,
        });
      } else if (type === 'income') {
        await createIncome({
          accountId,
          categoryId,
          amount: amountInCents,
          description: description.trim(),
          transactionDate: date,
        });
      } else {
        await createTransfer({
          fromAccountId,
          toAccountId,
          amount: amountInCents,
          description: description.trim(),
          transactionDate: date,
        });
      }
      handleClose();
    } catch {
      setFormError('Error al guardar la transacción');
    } finally {
      setFormLoading(false);
    }
  };

  const inputClass = "w-full h-11 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]";
  const labelClass = "block text-sm font-medium text-[var(--color-text-secondary)] mb-1";

  return (
    <Sheet open={open} onClose={handleClose} title="Nueva transacción">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className={labelClass}>Tipo</label>
          <div className="flex gap-2">
            {(['expense', 'income', 'transfer'] as const).map(t => (
              <button key={t} type="button" onClick={() => { setType(t); setCategoryId(''); }}
                className={`flex-1 h-11 rounded-lg text-sm font-medium transition-colors ${
                  type === t
                    ? t === 'expense' ? 'bg-rose-500 text-white' : t === 'income' ? 'bg-emerald-500 text-white' : 'bg-blue-500 text-white'
                    : 'bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)] border border-[var(--color-border)]'
                }`}>
                {t === 'expense' ? 'Gasto' : t === 'income' ? 'Ingreso' : 'Transferencia'}
              </button>
            ))}
          </div>
        </div>

        {type === 'transfer' ? (
          <>
            <div>
              <label className={labelClass}>Cuenta origen</label>
              <select value={fromAccountId} onChange={e => setFromAccountId(e.target.value)} className={inputClass}>
                <option value="">Seleccionar cuenta</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Cuenta destino</label>
              <select value={toAccountId} onChange={e => setToAccountId(e.target.value)} className={inputClass}>
                <option value="">Seleccionar cuenta</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          </>
        ) : (
          <>
            <div>
              <label className={labelClass}>Cuenta</label>
              <select value={accountId} onChange={e => setAccountId(e.target.value)} className={inputClass}>
                <option value="">Seleccionar cuenta</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Categoría</label>
              <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className={inputClass}>
                <option value="">Seleccionar categoría</option>
                {filteredCategories.map(c => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>
          </>
        )}

        <div>
          <label className={labelClass}>Monto ($)</label>
          <input type="number" inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)}
            className={inputClass} placeholder="15000" min="0" step="1" />
        </div>

        <div>
          <label className={labelClass}>Descripción</label>
          <input type="text" value={description} onChange={e => setDescription(e.target.value)}
            className={inputClass} placeholder="Ej: Almuerzo" />
        </div>

        <div>
          <label className={labelClass}>Fecha</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputClass} />
        </div>

        {formError && <p className="text-sm text-[var(--color-danger)]">{formError}</p>}

        <button type="submit" disabled={formLoading}
          className="w-full h-11 rounded-lg bg-[var(--color-primary)] text-white font-medium hover:bg-[var(--color-primary-dark)] disabled:opacity-50 transition-colors">
          {formLoading ? 'Guardando…' : 'Guardar'}
        </button>
      </form>
    </Sheet>
  );
}
