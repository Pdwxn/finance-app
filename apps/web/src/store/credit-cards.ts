import { create } from 'zustand';
import { db, enqueue } from '@finance-app/offline';
import type { CreditCard } from '@finance-app/types';
import { generateUUID } from '@finance-app/utils';
import { useAuthStore } from './auth';

function toCard(row: {
  id: string;
  userId: string;
  name: string;
  limitAmount: number;
  closingDay: number;
  dueDay: number;
  monthlyFee: number | null;
  interestRate: string | null;
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
    monthlyFee: row.monthlyFee,
    interestRate: row.interestRate ? Number(row.interestRate) : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    deletedAt: row.deletedAt?.toISOString() ?? null,
  };
}

interface CreateCardData {
  name: string;
  limitAmount: number;
  closingDay: number;
  dueDay: number;
  monthlyFee?: number | null;
  interestRate?: number | null;
}

interface CreditCardsState {
  cards: CreditCard[];
  isLoading: boolean;
  error: string | null;
  fetchCards: () => Promise<void>;
  createCard: (data: CreateCardData) => Promise<void>;
  updateCard: (
    id: string,
    data: Partial<CreditCard>
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
    const id = generateUUID();

    const row = {
      id, userId,
      name: data.name,
      limitAmount: data.limitAmount,
      closingDay: data.closingDay,
      dueDay: data.dueDay,
      monthlyFee: data.monthlyFee ?? null,
      interestRate: data.interestRate !== undefined && data.interestRate !== null ? String(data.interestRate) : null,
      createdAt: now, updatedAt: now, deletedAt: null,
    };

    await db.creditCards.add(row);
    await enqueue('create', 'creditCards', id, { ...row, userId });

    set(state => ({ cards: [...state.cards, toCard(row)] }));
  },

  updateCard: async (id, data) => {
    const now = new Date();
    const dbData: Record<string, unknown> = { ...data, updatedAt: now };
    if (data.interestRate !== undefined) {
      dbData.interestRate = data.interestRate !== null ? String(data.interestRate) : null;
    }

    await db.creditCards.update(id, dbData);
    await enqueue('update', 'creditCards', id, dbData);

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
