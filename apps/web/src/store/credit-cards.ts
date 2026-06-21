import { create } from 'zustand';
import { db, enqueue } from '@finance-app/offline';
import type { CreditCard } from '@finance-app/types';
import { useAuthStore } from './auth';

function toCard(row: {
  id: string;
  userId: string;
  name: string;
  limitAmount: number;
  closingDay: number;
  dueDay: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}): CreditCard {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    limitAmount: row.limitAmount,
    closingDay: row.closingDay,
    dueDay: row.dueDay,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    deletedAt: row.deletedAt?.toISOString() ?? null,
  };
}

interface CreditCardsState {
  cards: CreditCard[];
  isLoading: boolean;
  error: string | null;
  fetchCards: () => Promise<void>;
  createCard: (data: {
    name: string;
    limitAmount: number;
    closingDay: number;
    dueDay: number;
  }) => Promise<void>;
  updateCard: (
    id: string,
    data: Partial<Pick<CreditCard, 'name' | 'limitAmount' | 'closingDay' | 'dueDay'>>
  ) => Promise<void>;
  deleteCard: (id: string) => Promise<void>;
}

export const useCreditCardsStore = create<CreditCardsState>((set) => ({
  cards: [],
  isLoading: false,
  error: null,

  fetchCards: async () => {
    set({ isLoading: true, error: null });
    try {
      const userId = useAuthStore.getState().user?.id;
      if (!userId) {
        set({ cards: [], isLoading: false });
        return;
      }

      const rows = await db.creditCards
        .where('userId')
        .equals(userId)
        .filter(c => c.deletedAt === null)
        .toArray();

      set({ cards: rows.map(toCard), isLoading: false });
    } catch {
      set({ error: 'Error al cargar tarjetas', isLoading: false });
    }
  },

  createCard: async data => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return;

    const now = new Date();
    const id = crypto.randomUUID();

    await db.creditCards.add({
      id, userId,
      name: data.name,
      limitAmount: data.limitAmount,
      closingDay: data.closingDay,
      dueDay: data.dueDay,
      createdAt: now, updatedAt: now, deletedAt: null,
    });

    await enqueue('create', 'creditCards', id, { ...data, userId });

    const card = toCard({
      id, userId,
      name: data.name,
      limitAmount: data.limitAmount,
      closingDay: data.closingDay,
      dueDay: data.dueDay,
      createdAt: now, updatedAt: now, deletedAt: null,
    });

    set(state => ({ cards: [...state.cards, card] }));
  },

  updateCard: async (id, data) => {
    const now = new Date();
    const updateData: Record<string, unknown> = { ...data, updatedAt: now };

    await db.creditCards.update(id, updateData);
    await enqueue('update', 'creditCards', id, data);

    set(state => ({
      cards: state.cards.map(c =>
        c.id === id ? { ...c, ...data, updatedAt: now.toISOString() } : c
      ),
    }));
  },

  deleteCard: async id => {
    const now = new Date();

    await db.creditCards.update(id, { deletedAt: now, updatedAt: now });
    await enqueue('delete', 'creditCards', id, { deletedAt: now.toISOString() });

    set(state => ({
      cards: state.cards.filter(c => c.id !== id),
    }));
  },
}));
