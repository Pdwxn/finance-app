import { create } from 'zustand';
import { db, enqueue } from '@finance-app/offline';
import type { Debt } from '@finance-app/types';
import { generateUUID } from '@finance-app/utils';
import { useAuthStore } from './auth';

function toDebt(row: {
  id: string;
  userId: string;
  name: string;
  initialAmount: number;
  interestRate: string;
  startDate: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}): Debt {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    initialAmount: row.initialAmount,
    interestRate: Number.parseFloat(row.interestRate),
    startDate: row.startDate,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    deletedAt: row.deletedAt?.toISOString() ?? null,
  };
}

interface DebtsState {
  debts: Debt[];
  isLoading: boolean;
  error: string | null;
  fetchDebts: () => Promise<void>;
  createDebt: (data: {
    name: string;
    initialAmount: number;
    interestRate: number;
    startDate: string;
  }) => Promise<void>;
  updateDebt: (
    id: string,
    data: Partial<Pick<Debt, 'name' | 'initialAmount' | 'interestRate' | 'startDate'>>
  ) => Promise<void>;
  deleteDebt: (id: string) => Promise<void>;
}

export const useDebtsStore = create<DebtsState>((set) => ({
  debts: [],
  isLoading: false,
  error: null,

  fetchDebts: async () => {
    set({ isLoading: true, error: null });
    try {
      const userId = useAuthStore.getState().user?.id;
      if (!userId) { set({ debts: [], isLoading: false }); return; }

      const rows = await db.debts
        .where('userId')
        .equals(userId)
        .filter(d => d.deletedAt === null)
        .toArray();

      set({ debts: rows.map(toDebt), isLoading: false });
    } catch {
      set({ error: 'Error al cargar deudas', isLoading: false });
    }
  },

  createDebt: async data => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return;

    const now = new Date();
    const id = generateUUID();

    await db.debts.add({
      id, userId,
      name: data.name,
      initialAmount: data.initialAmount,
      interestRate: String(data.interestRate),
      startDate: data.startDate,
      createdAt: now, updatedAt: now, deletedAt: null,
    });

    await enqueue('create', 'debts', id, { ...data, userId });

    set(state => ({
      debts: [...state.debts, {
        id,
        userId,
        name: data.name,
        initialAmount: data.initialAmount,
        interestRate: data.interestRate,
        startDate: data.startDate,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        deletedAt: null,
      }],
    }));
  },

  updateDebt: async (id, data) => {
    const now = new Date();
    const updateData: Record<string, unknown> = { ...data, updatedAt: now };

    await db.debts.update(id, updateData);
    await enqueue('update', 'debts', id, data);

    set(state => ({
      debts: state.debts.map(d =>
        d.id === id ? { ...d, ...data, updatedAt: now.toISOString() } : d
      ),
    }));
  },

  deleteDebt: async id => {
    const now = new Date();
    await db.debts.update(id, { deletedAt: now, updatedAt: now });
    await enqueue('delete', 'debts', id, { deletedAt: now.toISOString() });
    set(state => ({ debts: state.debts.filter(d => d.id !== id) }));
  },
}));
