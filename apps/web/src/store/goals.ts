import { create } from 'zustand';
import { db, enqueue } from '@finance-app/offline';
import type { Goal } from '@finance-app/types';
import { useAuthStore } from './auth';

function toGoal(row: {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  targetDate: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}): Goal {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    targetAmount: row.targetAmount,
    targetDate: row.targetDate,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    deletedAt: row.deletedAt?.toISOString() ?? null,
  };
}

interface GoalsState {
  goals: Goal[];
  isLoading: boolean;
  error: string | null;
  fetchGoals: () => Promise<void>;
  createGoal: (data: { name: string; targetAmount: number; targetDate: string }) => Promise<void>;
  updateGoal: (
    id: string,
    data: Partial<Pick<Goal, 'name' | 'targetAmount' | 'targetDate'>>
  ) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
}

export const useGoalsStore = create<GoalsState>((set) => ({
  goals: [],
  isLoading: false,
  error: null,

  fetchGoals: async () => {
    set({ isLoading: true, error: null });
    try {
      const userId = useAuthStore.getState().user?.id;
      if (!userId) { set({ goals: [], isLoading: false }); return; }

      const rows = await db.goals
        .where('userId')
        .equals(userId)
        .filter(g => g.deletedAt === null)
        .toArray();

      set({ goals: rows.map(toGoal), isLoading: false });
    } catch {
      set({ error: 'Error al cargar metas', isLoading: false });
    }
  },

  createGoal: async data => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return;

    const now = new Date();
    const id = crypto.randomUUID();

    await db.goals.add({
      id, userId, name: data.name,
      targetAmount: data.targetAmount,
      targetDate: data.targetDate,
      createdAt: now, updatedAt: now, deletedAt: null,
    });

    await enqueue('create', 'goals', id, { ...data, userId });

    set(state => ({
      goals: [...state.goals, {
        id, userId, name: data.name,
        targetAmount: data.targetAmount,
        targetDate: data.targetDate,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        deletedAt: null,
      }],
    }));
  },

  updateGoal: async (id, data) => {
    const now = new Date();
    const updateData: Record<string, unknown> = { ...data, updatedAt: now };

    await db.goals.update(id, updateData);
    await enqueue('update', 'goals', id, data);

    set(state => ({
      goals: state.goals.map(g =>
        g.id === id ? { ...g, ...data, updatedAt: now.toISOString() } : g
      ),
    }));
  },

  deleteGoal: async id => {
    const now = new Date();
    await db.goals.update(id, { deletedAt: now, updatedAt: now });
    await enqueue('delete', 'goals', id, { deletedAt: now.toISOString() });
    set(state => ({ goals: state.goals.filter(g => g.id !== id) }));
  },
}));
