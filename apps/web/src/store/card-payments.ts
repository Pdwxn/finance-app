import { create } from 'zustand';
import { db, enqueue } from '@finance-app/offline';
import type { CardPayment } from '@finance-app/types';
import { generateUUID } from '@finance-app/utils';
import { useAuthStore } from './auth';
import { useExpensesStore } from './expenses';
import { useCategoriesStore } from './categories';
import { useCreditCardsStore } from './credit-cards';

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
  updatePayment: (
    id: string,
    data: Partial<Pick<CardPayment, 'creditCardId' | 'accountId' | 'amount' | 'paymentDate'>>
  ) => Promise<void>;
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
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return;

    const now = new Date();
    const id = generateUUID();

    await db.cardPayments.add({
      id,
      creditCardId: data.creditCardId,
      accountId: data.accountId,
      amount: data.amount,
      paymentDate: data.paymentDate,
      createdAt: now, updatedAt: now, deletedAt: null,
    });

    await enqueue('create', 'cardPayments', id, data);

    const card = useCreditCardsStore.getState().cards.find(c => c.id === data.creditCardId);
    const cardName = card?.name ?? 'tarjeta';
    const paymentCategory = useCategoriesStore.getState().getCategoryByName('Pago tarjeta');

    if (paymentCategory) {
      await useExpensesStore.getState().createExpense({
        accountId: data.accountId,
        categoryId: paymentCategory.id,
        amount: data.amount,
        description: `Pago tarjeta: ${cardName}`,
        transactionDate: data.paymentDate,
      });
    }

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

  updatePayment: async (id, data) => {
    const now = new Date();
    const updateData: Record<string, unknown> = { ...data, updatedAt: now };

    await db.cardPayments.update(id, updateData);
    await enqueue('update', 'cardPayments', id, data);

    set(state => ({
      payments: state.payments.map(p =>
        p.id === id ? { ...p, ...data, updatedAt: now.toISOString() } : p
      ),
    }));
  },

  deletePayment: async id => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return;

    const now = new Date();

    await db.cardPayments.update(id, { deletedAt: now, updatedAt: now });
    await enqueue('delete', 'cardPayments', id, { deletedAt: now.toISOString() });

    set(state => ({
      payments: state.payments.filter(p => p.id !== id),
    }));
  },
}));
