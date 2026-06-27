import { create } from 'zustand';
import { db, enqueue } from '@finance-app/offline';
import type { CardCharge } from '@finance-app/types';
import { generateUUID, generateInstallments, getStatementPeriod, getPeriodYYYYMM } from '@finance-app/utils';
import { useAuthStore } from './auth';
import { useCardChargeInstallmentsStore } from './card-charge-installments';

function toCharge(row: {
  id: string;
  creditCardId: string;
  categoryId: string;
  amount: number;
  description: string;
  transactionDate: string;
  isInstallment: boolean;
  totalInstallments: number | null;
  installmentAmount: number | null;
  interestRate: string | null;
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
    isInstallment: row.isInstallment,
    totalInstallments: row.totalInstallments,
    installmentAmount: row.installmentAmount,
    interestRate: row.interestRate ? Number(row.interestRate) : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    deletedAt: row.deletedAt?.toISOString() ?? null,
  };
}

interface CreateChargeData {
  creditCardId: string;
  categoryId: string;
  amount: number;
  description: string;
  transactionDate: string;
  isInstallment?: boolean;
  totalInstallments?: number | null;
  installmentAmount?: number | null;
  interestRate?: number | null;
}

interface CardChargesState {
  charges: CardCharge[];
  isLoading: boolean;
  error: string | null;
  fetchCharges: (creditCardId: string) => Promise<void>;
  fetchAllCharges: () => Promise<void>;
  createCharge: (data: CreateChargeData) => Promise<void>;
  updateCharge: (
    id: string,
    data: Partial<CardCharge>
  ) => Promise<void>;
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
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return;

    const now = new Date();
    const id = generateUUID();
    const isInstallment = data.isInstallment ?? false;
    const totalInstallments = data.totalInstallments ?? null;
    const interestRate = data.interestRate ?? null;
    const rateNumber = interestRate;

    const installmentsAmount = (isInstallment && totalInstallments && totalInstallments > 1)
      ? (data.installmentAmount ?? Math.round(data.amount / totalInstallments))
      : null;

    const chargeData = {
      id,
      creditCardId: data.creditCardId,
      categoryId: data.categoryId,
      amount: data.amount,
      description: data.description,
      transactionDate: data.transactionDate,
      isInstallment,
      totalInstallments,
      installmentAmount: installmentsAmount,
      interestRate: rateNumber !== null ? String(rateNumber) : null,
      createdAt: now, updatedAt: now, deletedAt: null,
    };

    await db.cardCharges.add(chargeData as Record<string, unknown> as never);
    await enqueue('create', 'cardCharges', id, { ...chargeData, updatedAt: now.toISOString() });

    if (isInstallment && totalInstallments && totalInstallments > 1) {
      const installments = generateInstallments(data.amount, interestRate, totalInstallments);

      const card = await db.creditCards.get(data.creditCardId);
      const closingDay = card?.closingDay ?? 15;

      const installStore = useCardChargeInstallmentsStore.getState();
      const firstPeriod = getStatementPeriod(data.transactionDate, closingDay, 15);
      const [baseYearStr, baseMonthStr] = firstPeriod.duePeriod.split('-');
      const baseYear = Number(baseYearStr);
      const baseMonth = Number(baseMonthStr);

      for (let i = 0; i < installments.length; i++) {
        const instId = generateUUID();
        const instDate = new Date(baseYear, baseMonth - 1 + i, 1);
        const duePeriod = getPeriodYYYYMM(instDate);

        await db.cardChargeInstallments.add({
          id: instId,
          cardChargeId: id,
          creditCardId: data.creditCardId,
          installmentNumber: i + 1,
          amount: installments[i]!,
          duePeriod,
          createdAt: now, updatedAt: now, deletedAt: null,
        });

        await enqueue('create', 'cardChargeInstallments', instId, {
          cardChargeId: id,
          creditCardId: data.creditCardId,
          installmentNumber: i + 1,
          amount: installments[i]!,
          duePeriod,
          updatedAt: now.toISOString(),
        });
      }

      await installStore.fetchInstallments(data.creditCardId);
    }

    const charge = toCharge(chargeData);

    set(state => ({ charges: [...state.charges, charge] }));
  },

  updateCharge: async (id, data) => {
    const now = new Date();
    const updateData: Record<string, unknown> = { ...data, updatedAt: now };

    await db.cardCharges.update(id, updateData);
    await enqueue('update', 'cardCharges', id, { ...data, updatedAt: now.toISOString() });

    set(state => ({
      charges: state.charges.map(c =>
        c.id === id ? { ...c, ...data, updatedAt: now.toISOString() } : c
      ),
    }));
  },

  deleteCharge: async id => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return;

    const now = new Date();

    await db.cardCharges.update(id, { deletedAt: now, updatedAt: now });
    await enqueue('delete', 'cardCharges', id, { deletedAt: now.toISOString(), updatedAt: now.toISOString() });

    set(state => ({
      charges: state.charges.filter(c => c.id !== id),
    }));
  },
}));
