import { create } from 'zustand';
import { db, enqueue } from '@finance-app/offline';
import type { CardCharge } from '@finance-app/types';

function toCharge(row: {
  id: string;
  creditCardId: string;
  categoryId: string;
  amount: number;
  description: string;
  transactionDate: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}): CardCharge {
  return {
    id: row.id,
    creditCardId: row.creditCardId,
    categoryId: row.categoryId,
    amount: row.amount,
    description: row.description,
    transactionDate: row.transactionDate,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    deletedAt: row.deletedAt?.toISOString() ?? null,
  };
}

interface CardChargesState {
  charges: CardCharge[];
  isLoading: boolean;
  error: string | null;
  fetchCharges: (creditCardId: string) => Promise<void>;
  fetchAllCharges: () => Promise<void>;
  createCharge: (data: {
    creditCardId: string;
    categoryId: string;
    amount: number;
    description: string;
    transactionDate: string;
  }) => Promise<void>;
  deleteCharge: (id: string) => Promise<void>;
}

export const useCardChargesStore = create<CardChargesState>((set) => ({
  charges: [],
  isLoading: false,
  error: null,

  fetchCharges: async (creditCardId: string) => {
    set({ isLoading: true, error: null });
    try {
      const rows = await db.cardCharges
        .where('creditCardId')
        .equals(creditCardId)
        .filter(c => c.deletedAt === null)
        .toArray();

      set({ charges: rows.map(toCharge), isLoading: false });
    } catch {
      set({ error: 'Error al cargar cargos', isLoading: false });
    }
  },

  fetchAllCharges: async () => {
    set({ isLoading: true, error: null });
    try {
      const rows = await db.cardCharges
        .filter(c => c.deletedAt === null)
        .toArray();

      set({ charges: rows.map(toCharge), isLoading: false });
    } catch {
      set({ error: 'Error al cargar cargos', isLoading: false });
    }
  },

  createCharge: async data => {
    const now = new Date();
    const id = crypto.randomUUID();

    await db.cardCharges.add({
      id,
      creditCardId: data.creditCardId,
      categoryId: data.categoryId,
      amount: data.amount,
      description: data.description,
      transactionDate: data.transactionDate,
      createdAt: now, updatedAt: now, deletedAt: null,
    });

    await enqueue('create', 'cardCharges', id, data);

    const charge = toCharge({
      id,
      creditCardId: data.creditCardId,
      categoryId: data.categoryId,
      amount: data.amount,
      description: data.description,
      transactionDate: data.transactionDate,
      createdAt: now, updatedAt: now, deletedAt: null,
    });

    set(state => ({ charges: [...state.charges, charge] }));
  },

  deleteCharge: async id => {
    const now = new Date();

    await db.cardCharges.update(id, { deletedAt: now, updatedAt: now });
    await enqueue('delete', 'cardCharges', id, { deletedAt: now.toISOString() });

    set(state => ({
      charges: state.charges.filter(c => c.id !== id),
    }));
  },
}));
