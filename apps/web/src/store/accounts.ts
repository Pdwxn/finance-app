import { create } from 'zustand';
import { db, enqueue } from '@finance-app/offline';
import type { Account } from '@finance-app/types';
import { generateUUID } from '@finance-app/utils';
import { useAuthStore } from './auth';

function toAccount(row: {
  id: string;
  userId: string;
  name: string;
  type: string;
  currency: string;
  initialBalance: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}): Account {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    type: row.type as Account['type'],
    currency: row.currency,
    initialBalance: row.initialBalance,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    deletedAt: row.deletedAt?.toISOString() ?? null,
  };
}

interface AccountsState {
  accounts: Account[];
  isLoading: boolean;
  error: string | null;
  fetchAccounts: () => Promise<void>;
  createAccount: (data: {
    name: string;
    type: Account['type'];
    currency: string;
    initialBalance: number;
  }) => Promise<void>;
  updateAccount: (
    id: string,
    data: Partial<Pick<Account, 'name' | 'type' | 'currency' | 'initialBalance'>>
  ) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  getAccountById: (id: string) => Account | undefined;
}

export const useAccountsStore = create<AccountsState>((set, get) => ({
  accounts: [],
  isLoading: false,
  error: null,

  fetchAccounts: async () => {
    set({ isLoading: true, error: null });
    try {
      const userId = useAuthStore.getState().user?.id;
      if (!userId) {
        set({ accounts: [], isLoading: false });
        return;
      }

      const rows = await db.accounts
        .where('userId')
        .equals(userId)
        .filter(a => a.deletedAt === null)
        .toArray();

      set({ accounts: rows.map(toAccount), isLoading: false });
    } catch {
      set({ error: 'Error al cargar cuentas', isLoading: false });
    }
  },

  createAccount: async data => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return;

    const now = new Date();
    const id = generateUUID();

    await db.accounts.add({
      id,
      userId,
      name: data.name,
      type: data.type,
      currency: data.currency,
      initialBalance: data.initialBalance,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });

    await enqueue('create', 'accounts', id, { ...data, userId, updatedAt: now.toISOString() });

    const account = toAccount({
      id,
      userId,
      name: data.name,
      type: data.type,
      currency: data.currency,
      initialBalance: data.initialBalance,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });

    set(state => ({ accounts: [...state.accounts, account] }));
  },

  updateAccount: async (id, data) => {
    const now = new Date();
    const updateData: Record<string, unknown> = { ...data, updatedAt: now };

    await db.accounts.update(id, updateData);
    await enqueue('update', 'accounts', id, { ...data, updatedAt: now.toISOString() });

    set(state => ({
      accounts: state.accounts.map(a =>
        a.id === id ? { ...a, ...data, updatedAt: now.toISOString() } : a
      ),
    }));
  },

  deleteAccount: async id => {
    const now = new Date();

    await db.accounts.update(id, { deletedAt: now, updatedAt: now });
    await enqueue('delete', 'accounts', id, { deletedAt: now.toISOString(), updatedAt: now.toISOString() });

    set(state => ({
      accounts: state.accounts.filter(a => a.id !== id),
    }));
  },

  getAccountById: id => {
    return get().accounts.find(a => a.id === id);
  },
}));
