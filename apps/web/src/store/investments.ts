import { create } from 'zustand';
import { db, enqueue } from '@finance-app/offline';
import type { Investment } from '@finance-app/types';
import { useAuthStore } from './auth';

function toInvestment(row: {
  id: string;
  userId: string;
  symbol: string;
  name: string;
  quantity: string;
  averageCost: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}): Investment {
  return {
    id: row.id,
    userId: row.userId,
    symbol: row.symbol,
    name: row.name,
    quantity: Number.parseFloat(row.quantity),
    averageCost: row.averageCost,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    deletedAt: row.deletedAt?.toISOString() ?? null,
  };
}

interface InvestmentsState {
  investments: Investment[];
  isLoading: boolean;
  error: string | null;
  fetchInvestments: () => Promise<void>;
  createInvestment: (data: {
    symbol: string;
    name: string;
    quantity: number;
    averageCost: number;
  }) => Promise<void>;
  updateInvestment: (
    id: string,
    data: Partial<Pick<Investment, 'symbol' | 'name' | 'quantity' | 'averageCost'>>
  ) => Promise<void>;
  deleteInvestment: (id: string) => Promise<void>;
}

export const useInvestmentsStore = create<InvestmentsState>((set) => ({
  investments: [],
  isLoading: false,
  error: null,

  fetchInvestments: async () => {
    set({ isLoading: true, error: null });
    try {
      const userId = useAuthStore.getState().user?.id;
      if (!userId) { set({ investments: [], isLoading: false }); return; }

      const rows = await db.investments
        .where('userId')
        .equals(userId)
        .filter(i => i.deletedAt === null)
        .toArray();

      set({ investments: rows.map(toInvestment), isLoading: false });
    } catch {
      set({ error: 'Error al cargar inversiones', isLoading: false });
    }
  },

  createInvestment: async data => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return;

    const now = new Date();
    const id = crypto.randomUUID();

    await db.investments.add({
      id, userId,
      symbol: data.symbol.toUpperCase(),
      name: data.name,
      quantity: String(data.quantity),
      averageCost: data.averageCost,
      createdAt: now, updatedAt: now, deletedAt: null,
    });

    await enqueue('create', 'investments', id, { ...data, userId });

    set(state => ({
      investments: [...state.investments, {
        id, userId,
        symbol: data.symbol.toUpperCase(),
        name: data.name,
        quantity: data.quantity,
        averageCost: data.averageCost,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        deletedAt: null,
      }],
    }));
  },

  updateInvestment: async (id, data) => {
    const now = new Date();
    const updateData: Record<string, unknown> = { ...data, updatedAt: now };

    await db.investments.update(id, updateData);
    await enqueue('update', 'investments', id, data);

    set(state => ({
      investments: state.investments.map(i =>
        i.id === id ? { ...i, ...data, updatedAt: now.toISOString() } : i
      ),
    }));
  },

  deleteInvestment: async id => {
    const now = new Date();
    await db.investments.update(id, { deletedAt: now, updatedAt: now });
    await enqueue('delete', 'investments', id, { deletedAt: now.toISOString() });
    set(state => ({ investments: state.investments.filter(i => i.id !== id) }));
  },
}));
