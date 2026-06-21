import { create } from 'zustand';
import { db, enqueue } from '@finance-app/offline';
import type { DebtPayment } from '@finance-app/types';

function toPayment(row: {
  id: string;
  debtId: string;
  amount: number;
  paymentDate: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}): DebtPayment {
  return {
    id: row.id,
    debtId: row.debtId,
    amount: row.amount,
    paymentDate: row.paymentDate,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    deletedAt: row.deletedAt?.toISOString() ?? null,
  };
}

interface DebtPaymentsState {
  payments: DebtPayment[];
  isLoading: boolean;
  error: string | null;
  fetchPayments: (debtId: string) => Promise<void>;
  createPayment: (data: {
    debtId: string;
    amount: number;
    paymentDate: string;
  }) => Promise<void>;
}

export const useDebtPaymentsStore = create<DebtPaymentsState>((set) => ({
  payments: [],
  isLoading: false,
  error: null,

  fetchPayments: async (debtId: string) => {
    set({ isLoading: true, error: null });
    try {
      const rows = await db.debtPayments
        .where('debtId')
        .equals(debtId)
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

    await db.debtPayments.add({
      id,
      debtId: data.debtId,
      amount: data.amount,
      paymentDate: data.paymentDate,
      createdAt: now, updatedAt: now, deletedAt: null,
    });

    await enqueue('create', 'debtPayments', id, data);

    set(state => ({
      payments: [...state.payments, {
        id,
        debtId: data.debtId,
        amount: data.amount,
        paymentDate: data.paymentDate,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        deletedAt: null,
      }],
    }));
  },
}));
