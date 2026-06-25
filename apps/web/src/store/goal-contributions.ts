import { create } from 'zustand';
import { db, enqueue } from '@finance-app/offline';
import type { GoalContribution } from '@finance-app/types';
import { useAuthStore } from './auth';
import { useExpensesStore } from './expenses';
import { useCategoriesStore } from './categories';
import { useGoalsStore } from './goals';

function toContribution(row: {
  id: string;
  goalId: string;
  accountId: string;
  amount: number;
  contributionDate: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}): GoalContribution {
  return {
    id: row.id,
    goalId: row.goalId,
    accountId: row.accountId,
    amount: row.amount,
    contributionDate: row.contributionDate,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    deletedAt: row.deletedAt?.toISOString() ?? null,
  };
}

interface GoalContributionsState {
  contributions: GoalContribution[];
  isLoading: boolean;
  error: string | null;
  fetchContributions: (goalId: string) => Promise<void>;
  createContribution: (data: {
    goalId: string;
    accountId: string;
    amount: number;
    contributionDate: string;
  }) => Promise<void>;
}

export const useGoalContributionsStore = create<GoalContributionsState>((set) => ({
  contributions: [],
  isLoading: false,
  error: null,

  fetchContributions: async (goalId: string) => {
    set({ isLoading: true, error: null });
    try {
      const rows = await db.goalContributions
        .where('goalId')
        .equals(goalId)
        .filter(c => c.deletedAt === null)
        .toArray();

      set({ contributions: rows.map(toContribution), isLoading: false });
    } catch {
      set({ error: 'Error al cargar aportes', isLoading: false });
    }
  },

  createContribution: async data => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return;

    const now = new Date();
    const id = crypto.randomUUID();

    await db.goalContributions.add({
      id,
      goalId: data.goalId,
      accountId: data.accountId,
      amount: data.amount,
      contributionDate: data.contributionDate,
      createdAt: now, updatedAt: now, deletedAt: null,
    });

    await enqueue('create', 'goalContributions', id, data);

    const goal = useGoalsStore.getState().goals.find(g => g.id === data.goalId);
    const goalName = goal?.name ?? 'meta';
    const savingsCategory = useCategoriesStore.getState().getCategoryByName('Ahorro/Inversión');

    if (savingsCategory) {
      await useExpensesStore.getState().createExpense({
        accountId: data.accountId,
        categoryId: savingsCategory.id,
        amount: data.amount,
        description: `Aporte a meta: ${goalName}`,
        transactionDate: data.contributionDate,
      });
    }

    set(state => ({
      contributions: [...state.contributions, {
        id,
        goalId: data.goalId,
        accountId: data.accountId,
        amount: data.amount,
        contributionDate: data.contributionDate,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        deletedAt: null,
      }],
    }));
  },
}));
