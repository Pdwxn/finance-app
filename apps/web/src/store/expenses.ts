import { create } from 'zustand';
import { db, enqueue } from '@finance-app/offline';
import type { Expense } from '@finance-app/types';
import { generateUUID } from '@finance-app/utils';
import { useAuthStore } from './auth';

function toExpense(row: {
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
}): Expense {
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

interface ExpensesState {
  expenses: Expense[];
  isLoading: boolean;
  error: string | null;
  fetchExpenses: () => Promise<void>;
  createExpense: (data: {
    accountId: string;
    categoryId: string;
    amount: number;
    description: string;
    transactionDate: string;
  }) => Promise<void>;
  updateExpense: (
    id: string,
    data: Partial<Pick<Expense, 'accountId' | 'categoryId' | 'amount' | 'description' | 'transactionDate'>>
  ) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
}

export const useExpensesStore = create<ExpensesState>((set) => ({
  expenses: [],
  isLoading: false,
  error: null,

  fetchExpenses: async () => {
    set({ isLoading: true, error: null });
    try {
      const userId = useAuthStore.getState().user?.id;
      if (!userId) {
        set({ expenses: [], isLoading: false });
        return;
      }

      const rows = await db.expenses
        .where('userId')
        .equals(userId)
        .filter(e => e.deletedAt === null)
        .toArray();

      set({ expenses: rows.map(toExpense), isLoading: false });
    } catch {
      set({ error: 'Error al cargar gastos', isLoading: false });
    }
  },

  createExpense: async data => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return;

    const now = new Date();
    const id = generateUUID();

    await db.expenses.add({
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

    await enqueue('create', 'expenses', id, { ...data, userId });

    const expense = toExpense({
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

    set(state => ({ expenses: [...state.expenses, expense] }));
  },

  updateExpense: async (id, data) => {
    const now = new Date();
    const updateData: Record<string, unknown> = { ...data, updatedAt: now };

    await db.expenses.update(id, updateData);
    await enqueue('update', 'expenses', id, data);

    set(state => ({
      expenses: state.expenses.map(e =>
        e.id === id ? { ...e, ...data, updatedAt: now.toISOString() } : e
      ),
    }));
  },

  deleteExpense: async id => {
    const now = new Date();

    await db.expenses.update(id, { deletedAt: now, updatedAt: now });
    await enqueue('delete', 'expenses', id, { deletedAt: now.toISOString() });

    set(state => ({
      expenses: state.expenses.filter(e => e.id !== id),
    }));
  },
}));
