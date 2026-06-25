import { create } from 'zustand';
import { db, enqueue } from '@finance-app/offline';
import type { Transfer } from '@finance-app/types';
import { generateUUID } from '@finance-app/utils';
import { useAuthStore } from './auth';

function toTransfer(row: {
  id: string;
  userId: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  description: string;
  transactionDate: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}): Transfer {
  return {
    id: row.id,
    userId: row.userId,
    fromAccountId: row.fromAccountId,
    toAccountId: row.toAccountId,
    amount: row.amount,
    description: row.description,
    transactionDate: row.transactionDate,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    deletedAt: row.deletedAt?.toISOString() ?? null,
  };
}

interface TransfersState {
  transfers: Transfer[];
  isLoading: boolean;
  error: string | null;
  fetchTransfers: () => Promise<void>;
  createTransfer: (data: {
    fromAccountId: string;
    toAccountId: string;
    amount: number;
    description: string;
    transactionDate: string;
  }) => Promise<void>;
  updateTransfer: (
    id: string,
    data: Partial<Pick<Transfer, 'fromAccountId' | 'toAccountId' | 'amount' | 'description' | 'transactionDate'>>
  ) => Promise<void>;
  deleteTransfer: (id: string) => Promise<void>;
}

export const useTransfersStore = create<TransfersState>((set) => ({
  transfers: [],
  isLoading: false,
  error: null,

  fetchTransfers: async () => {
    set({ isLoading: true, error: null });
    try {
      const userId = useAuthStore.getState().user?.id;
      if (!userId) {
        set({ transfers: [], isLoading: false });
        return;
      }

      const rows = await db.transfers
        .where('userId')
        .equals(userId)
        .filter(t => t.deletedAt === null)
        .toArray();

      set({ transfers: rows.map(toTransfer), isLoading: false });
    } catch {
      set({ error: 'Error al cargar transferencias', isLoading: false });
    }
  },

  createTransfer: async data => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return;

    const now = new Date();
    const id = generateUUID();

    await db.transfers.add({
      id,
      userId,
      fromAccountId: data.fromAccountId,
      toAccountId: data.toAccountId,
      amount: data.amount,
      description: data.description,
      transactionDate: data.transactionDate,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });

    await enqueue('create', 'transfers', id, { ...data, userId });

    const transfer = toTransfer({
      id,
      userId,
      fromAccountId: data.fromAccountId,
      toAccountId: data.toAccountId,
      amount: data.amount,
      description: data.description,
      transactionDate: data.transactionDate,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });

    set(state => ({ transfers: [...state.transfers, transfer] }));
  },

  updateTransfer: async (id, data) => {
    const now = new Date();
    const updateData: Record<string, unknown> = { ...data, updatedAt: now };

    await db.transfers.update(id, updateData);
    await enqueue('update', 'transfers', id, data);

    set(state => ({
      transfers: state.transfers.map(t =>
        t.id === id ? { ...t, ...data, updatedAt: now.toISOString() } : t
      ),
    }));
  },

  deleteTransfer: async id => {
    const now = new Date();

    await db.transfers.update(id, { deletedAt: now, updatedAt: now });
    await enqueue('delete', 'transfers', id, { deletedAt: now.toISOString() });

    set(state => ({
      transfers: state.transfers.filter(t => t.id !== id),
    }));
  },
}));
