import { create } from 'zustand';
import { db } from '@finance-app/offline';
import type { CardChargeInstallment } from '@finance-app/types';

function toInstallment(row: {
  id: string;
  cardChargeId: string;
  creditCardId: string;
  installmentNumber: number;
  amount: number;
  duePeriod: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}): CardChargeInstallment {
  return {
    id: row.id,
    cardChargeId: row.cardChargeId,
    creditCardId: row.creditCardId,
    installmentNumber: row.installmentNumber,
    amount: row.amount,
    duePeriod: row.duePeriod,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    deletedAt: row.deletedAt?.toISOString() ?? null,
  };
}

interface CardChargeInstallmentsState {
  installments: CardChargeInstallment[];
  isLoading: boolean;
  error: string | null;
  fetchInstallments: (creditCardId: string) => Promise<void>;
  fetchInstallmentsByPeriod: (creditCardId: string, period: string) => Promise<CardChargeInstallment[]>;
}

export const useCardChargeInstallmentsStore = create<CardChargeInstallmentsState>((set) => ({
  installments: [],
  isLoading: false,
  error: null,

  fetchInstallments: async (creditCardId: string) => {
    set({ isLoading: true, error: null });
    try {
      const rows = await db.cardChargeInstallments
        .where('creditCardId')
        .equals(creditCardId)
        .filter(i => i.deletedAt === null)
        .toArray();

      set({ installments: rows.map(toInstallment), isLoading: false });
    } catch {
      set({ error: 'Error al cargar cuotas', isLoading: false });
    }
  },

  fetchInstallmentsByPeriod: async (creditCardId: string, period: string) => {
    try {
      const rows = await db.cardChargeInstallments
        .where('[creditCardId+duePeriod]')
        .equals([creditCardId, period])
        .filter(i => i.deletedAt === null)
        .toArray();

      return rows.map(toInstallment);
    } catch {
      return [];
    }
  },
}));
