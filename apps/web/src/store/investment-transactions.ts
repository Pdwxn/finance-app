import { create } from 'zustand';
import { db, enqueue } from '@finance-app/offline';
import type { InvestmentTransaction, InvestmentTransactionType } from '@finance-app/types';

function toTransaction(row: {
  id: string;
  investmentId: string;
  type: string;
  quantity: string;
  price: number;
  transactionDate: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}): InvestmentTransaction {
  return {
    id: row.id,
    investmentId: row.investmentId,
    type: row.type as InvestmentTransactionType,
    quantity: Number.parseFloat(row.quantity),
    price: row.price,
    transactionDate: row.transactionDate,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    deletedAt: row.deletedAt?.toISOString() ?? null,
  };
}

interface InvestmentTransactionsState {
  transactions: InvestmentTransaction[];
  isLoading: boolean;
  error: string | null;
  fetchTransactions: (investmentId: string) => Promise<void>;
  createTransaction: (data: {
    investmentId: string;
    type: InvestmentTransactionType;
    quantity: number;
    price: number;
    transactionDate: string;
  }) => Promise<void>;
}

export const useInvestmentTransactionsStore = create<InvestmentTransactionsState>((set) => ({
  transactions: [],
  isLoading: false,
  error: null,

  fetchTransactions: async (investmentId: string) => {
    set({ isLoading: true, error: null });
    try {
      const rows = await db.investmentTransactions
        .where('investmentId')
        .equals(investmentId)
        .filter(t => t.deletedAt === null)
        .toArray();

      set({ transactions: rows.map(toTransaction), isLoading: false });
    } catch {
      set({ error: 'Error al cargar transacciones', isLoading: false });
    }
  },

  createTransaction: async data => {
    const now = new Date();
    const id = crypto.randomUUID();

    await db.investmentTransactions.add({
      id,
      investmentId: data.investmentId,
      type: data.type,
      quantity: String(data.quantity),
      price: data.price,
      transactionDate: data.transactionDate,
      createdAt: now, updatedAt: now, deletedAt: null,
    });

    await enqueue('create', 'investmentTransactions', id, { ...data, quantity: String(data.quantity) });

    set(state => ({
      transactions: [...state.transactions, {
        id,
        investmentId: data.investmentId,
        type: data.type,
        quantity: data.quantity,
        price: data.price,
        transactionDate: data.transactionDate,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        deletedAt: null,
      }],
    }));
  },
}));
