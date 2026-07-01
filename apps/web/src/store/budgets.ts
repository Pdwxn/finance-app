import { create } from 'zustand';
import { db, enqueue } from '@finance-app/offline';
import type { Budget } from '@finance-app/types';
import { generateUUID } from '@finance-app/utils';
import { useAuthStore } from './auth';

function toBudget(row: {
  id: string;
  userId: string;
  categoryId: string;
  period: string;
  limitAmount: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}): Budget {
  return {
    id: row.id,
    userId: row.userId,
    categoryId: row.categoryId,
    period: row.period,
    limitAmount: row.limitAmount,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    deletedAt: row.deletedAt?.toISOString() ?? null,
  };
}

interface BudgetsState {
  budgets: Budget[];
  isLoading: boolean;
  error: string | null;
  fetchBudgets: () => Promise<void>;
  createBudget: (data: { categoryId: string; period: string; limitAmount: number }) => Promise<void>;
  updateBudget: (id: string, data: Partial<Pick<Budget, 'limitAmount'>>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
}

export const useBudgetsStore = create<BudgetsState>((set) => ({
  budgets: [],
  isLoading: false,
  error: null,

  fetchBudgets: async () => {
    set({ isLoading: true, error: null });
    try {
      const userId = useAuthStore.getState().user?.id;
      if (!userId) { set({ budgets: [], isLoading: false }); return; }

      const rows = await db.budgets
        .where('userId')
        .equals(userId)
        .filter(b => b.deletedAt === null)
        .toArray();

      set({ budgets: rows.map(toBudget), isLoading: false });
    } catch {
      set({ error: 'Error al cargar presupuestos', isLoading: false });
    }
  },

  createBudget: async data => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return;

    const now = new Date();
    const id = generateUUID();

    await db.budgets.add({
      id,
      userId,
      categoryId: data.categoryId,
      period: data.period,
      limitAmount: data.limitAmount,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });

    await enqueue('create', 'budgets', id, { ...data, userId });

    set(state => ({
      budgets: [...state.budgets, {
        id,
        userId,
        categoryId: data.categoryId,
        period: data.period,
        limitAmount: data.limitAmount,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        deletedAt: null,
      }],
    }));
  },

  updateBudget: async (id, data) => {
    const now = new Date();
    const updateData: Record<string, unknown> = { ...data, updatedAt: now };

    await db.budgets.update(id, updateData);
    await enqueue('update', 'budgets', id, data);

    set(state => ({
      budgets: state.budgets.map(b =>
        b.id === id ? { ...b, ...data, updatedAt: now.toISOString() } : b
      ),
    }));
  },

  deleteBudget: async id => {
    const now = new Date();
    await db.budgets.update(id, { deletedAt: now, updatedAt: now });
    await enqueue('delete', 'budgets', id, { deletedAt: now.toISOString() });
    set(state => ({ budgets: state.budgets.filter(b => b.id !== id) }));
  },
}));
