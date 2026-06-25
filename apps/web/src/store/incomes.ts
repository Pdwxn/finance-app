import { create } from 'zustand';
import { db, enqueue } from '@finance-app/offline';
import type { Income } from '@finance-app/types';
import { generateUUID } from '@finance-app/utils';
import { useAuthStore } from './auth';

function toIncome(row: {
  id: string;
  userId: string;
  accountId: string;
  categoryId: string;
  amount: number;
  description: string;
  transactionDate: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}): Income {
  return {
    id: row.id,
    userId: row.userId,
    accountId: row.accountId,
    categoryId: row.categoryId,
    amount: row.amount,
    description: row.description,
    transactionDate: row.transactionDate,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    deletedAt: row.deletedAt?.toISOString() ?? null,
  };
}

interface IncomesState {
  incomes: Income[];
  isLoading: boolean;
  error: string | null;
  fetchIncomes: () => Promise<void>;
  createIncome: (data: {
    accountId: string;
    categoryId: string;
    amount: number;
    description: string;
    transactionDate: string;
  }) => Promise<void>;
  updateIncome: (
    id: string,
    data: Partial<Pick<Income, 'accountId' | 'categoryId' | 'amount' | 'description' | 'transactionDate'>>
  ) => Promise<void>;
  deleteIncome: (id: string) => Promise<void>;
}

export const useIncomesStore = create<IncomesState>((set) => ({
  incomes: [],
  isLoading: false,
  error: null,

  fetchIncomes: async () => {
    set({ isLoading: true, error: null });
    try {
      const userId = useAuthStore.getState().user?.id;
      if (!userId) {
        set({ incomes: [], isLoading: false });
        return;
      }

      const rows = await db.incomes
        .where('userId')
        .equals(userId)
        .filter(i => i.deletedAt === null)
        .toArray();

      set({ incomes: rows.map(toIncome), isLoading: false });
    } catch {
      set({ error: 'Error al cargar ingresos', isLoading: false });
    }
  },

  createIncome: async data => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return;

    const now = new Date();
    const id = generateUUID();

    await db.incomes.add({
      id,
      userId,
      accountId: data.accountId,
      categoryId: data.categoryId,
      amount: data.amount,
      description: data.description,
      transactionDate: data.transactionDate,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });

    await enqueue('create', 'incomes', id, { ...data, userId });

    const income = toIncome({
      id,
      userId,
      accountId: data.accountId,
      categoryId: data.categoryId,
      amount: data.amount,
      description: data.description,
      transactionDate: data.transactionDate,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });

    set(state => ({ incomes: [...state.incomes, income] }));
  },

  updateIncome: async (id, data) => {
    const now = new Date();
    const updateData: Record<string, unknown> = { ...data, updatedAt: now };

    await db.incomes.update(id, updateData);
    await enqueue('update', 'incomes', id, data);

    set(state => ({
      incomes: state.incomes.map(i =>
        i.id === id ? { ...i, ...data, updatedAt: now.toISOString() } : i
      ),
    }));
  },

  deleteIncome: async id => {
    const now = new Date();

    await db.incomes.update(id, { deletedAt: now, updatedAt: now });
    await enqueue('delete', 'incomes', id, { deletedAt: now.toISOString() });

    set(state => ({
      incomes: state.incomes.filter(i => i.id !== id),
    }));
  },
}));
