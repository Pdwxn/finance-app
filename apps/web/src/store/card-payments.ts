import { create } from 'zustand';
import { db, enqueue } from '@finance-app/offline';
import type { CardPayment } from '@finance-app/types';

function toPayment(row: {
  id: string;
  creditCardId: string;
  accountId: string;
  amount: number;
  paymentDate: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}): CardPayment {
  return {
    id: row.id,
    creditCardId: row.creditCardId,
    accountId: row.accountId,
    amount: row.amount,
    paymentDate: row.paymentDate,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    deletedAt: row.deletedAt?.toISOString() ?? null,
  };
}

interface CardPaymentsState {
  payments: CardPayment[];
  isLoading: boolean;
  error: string | null;
  fetchPayments: (creditCardId: string) => Promise<void>;
  createPayment: (data: {
    creditCardId: string;
    accountId: string;
    amount: number;
    paymentDate: string;
  }) => Promise<void>;
  deletePayment: (id: string) => Promise<void>;
}

export const useCardPaymentsStore = create<CardPaymentsState>((set) => ({
  payments: [],
  isLoading: false,
  error: null,

  fetchPayments: async (creditCardId: string) => {
    set({ isLoading: true, error: null });
    try {
      const rows = await db.cardPayments
        .where('creditCardId')
        .equals(creditCardId)
        .filter(p => p.deletedAt === null)
        .toArray();

      set({ payments: rows.map(toPayment), isLoading: false });
    } catch {
      set({ error: 'Error al cargar pagos', isLoading: false });
    }
  },

  createPayment: async data => {
    const now = new Date();
    const id = crypto.randomUUID();

    await db.cardPayments.add({
      id,
      creditCardId: data.creditCardId,
      accountId: data.accountId,
      amount: data.amount,
      paymentDate: data.paymentDate,
      createdAt: now, updatedAt: now, deletedAt: null,
    });

    await enqueue('create', 'cardPayments', id, data);

    const payment = toPayment({
      id,
      creditCardId: data.creditCardId,
      accountId: data.accountId,
      amount: data.amount,
      paymentDate: data.paymentDate,
      createdAt: now, updatedAt: now, deletedAt: null,
    });

    set(state => ({ payments: [...state.payments, payment] }));
  },

  deletePayment: async id => {
    const now = new Date();

    await db.cardPayments.update(id, { deletedAt: now, updatedAt: now });
    await enqueue('delete', 'cardPayments', id, { deletedAt: now.toISOString() });

    set(state => ({
      payments: state.payments.filter(p => p.id !== id),
    }));
  },
}));
