import Dexie, { type EntityTable, type Table } from 'dexie';

interface Account {
  id: string;
  userId: string;
  name: string;
  type: string;
  currency: string;
  initialBalance: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

interface Category {
  id: string;
  userId: string;
  name: string;
  type: string;
  icon: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

interface Expense {
  id: string;
  userId: string;
  accountId: string;
  categoryId: string;
  amount: number;
  description: string;
  transactionDate: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

interface Income {
  id: string;
  userId: string;
  accountId: string;
  categoryId: string;
  amount: number;
  description: string;
  transactionDate: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

interface Transfer {
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
}

interface CreditCard {
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
}

interface CardCharge {
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
}

interface CardChargeInstallment {
  id: string;
  cardChargeId: string;
  creditCardId: string;
  installmentNumber: number;
  amount: number;
  duePeriod: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

interface CardPayment {
  id: string;
  creditCardId: string;
  accountId: string;
  amount: number;
  paymentDate: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

interface Debt {
  id: string;
  userId: string;
  name: string;
  initialAmount: number;
  interestRate: string;
  startDate: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

interface DebtPayment {
  id: string;
  debtId: string;
  accountId: string;
  amount: number;
  paymentDate: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

interface Goal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  targetDate: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

interface GoalContribution {
  id: string;
  goalId: string;
  accountId: string;
  amount: number;
  contributionDate: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

interface Investment {
  id: string;
  userId: string;
  symbol: string;
  name: string;
  quantity: string;
  averageCost: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

interface SyncQueueItem {
  id: string;
  operation: 'create' | 'update' | 'delete';
  entity: string;
  entityId: string;
  payload: unknown;
  status: 'pending' | 'syncing' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

interface InvestmentTransaction {
  id: string;
  investmentId: string;
  type: string;
  quantity: string;
  price: number;
  transactionDate: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

interface Budget {
  id: string;
  userId: string;
  categoryId: string;
  period: string;
  limitAmount: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

interface FinancialReport {
  id: string;
  userId: string;
  type: string;
  periodStart: string;
  periodEnd: string;
  title: string;
  summary: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export type {
  FinancialReport,
  Account,
  Category,
  Expense,
  Income,
  Transfer,
  CreditCard,
  CardCharge,
  CardChargeInstallment,
  CardPayment,
  Debt,
  DebtPayment,
  Goal,
  GoalContribution,
  Investment,
  InvestmentTransaction,
  Budget,
  SyncQueueItem,
};

class FinanceDB extends Dexie {
  accounts!: EntityTable<Account, 'id'>;
  categories!: EntityTable<Category, 'id'>;
  expenses!: EntityTable<Expense, 'id'>;
  incomes!: EntityTable<Income, 'id'>;
  transfers!: EntityTable<Transfer, 'id'>;
  creditCards!: EntityTable<CreditCard, 'id'>;
  cardCharges!: EntityTable<CardCharge, 'id'>;
  cardChargeInstallments!: EntityTable<CardChargeInstallment, 'id'>;
  cardPayments!: EntityTable<CardPayment, 'id'>;
  debts!: EntityTable<Debt, 'id'>;
  debtPayments!: EntityTable<DebtPayment, 'id'>;
  goals!: EntityTable<Goal, 'id'>;
  goalContributions!: EntityTable<GoalContribution, 'id'>;
  investments!: EntityTable<Investment, 'id'>;
  investmentTransactions!: EntityTable<InvestmentTransaction, 'id'>;
  budgets!: EntityTable<Budget, 'id'>;
  reports!: EntityTable<FinancialReport, 'id'>;
  syncQueue!: EntityTable<SyncQueueItem, 'id'>;

  constructor() {
    super('numa');

    this.version(5).stores({
      accounts: '&id, userId, [userId+createdAt]',
      categories: '&id, userId, [userId+createdAt]',
      expenses: '&id, userId, accountId, categoryId, [userId+createdAt], [userId+transactionDate]',
      incomes: '&id, userId, accountId, categoryId, [userId+createdAt], [userId+transactionDate]',
      transfers: '&id, userId, fromAccountId, toAccountId, [userId+createdAt], [userId+transactionDate]',
      creditCards: '&id, userId, [userId+createdAt]',
      cardCharges: '&id, creditCardId, categoryId, [creditCardId+createdAt]',
      cardChargeInstallments: '&id, cardChargeId, creditCardId, duePeriod, [creditCardId+duePeriod]',
      cardPayments: '&id, creditCardId, accountId, [creditCardId+createdAt]',
      debts: '&id, userId, [userId+createdAt]',
      debtPayments: '&id, debtId, accountId, [debtId+createdAt]',
      goals: '&id, userId, [userId+createdAt]',
      goalContributions: '&id, goalId, accountId, [goalId+createdAt]',
      investments: '&id, userId, [userId+createdAt]',
      investmentTransactions: '&id, investmentId, [investmentId+createdAt]',
      budgets: '&id, userId, categoryId, period, [userId+period], [userId+categoryId+period]',
      reports: '&id, userId, type, [userId+type], [userId+createdAt]',
      syncQueue: '&id, status, entity, createdAt, [status+createdAt]',
    });
  }
}

export const db = new FinanceDB();

/**
 * Las entidades concretas (Expense, Income, etc.) no tienen índice de tipo
 * string, así que no son estructuralmente asignables a una tabla genérica.
 * Este cast es el mismo escape "dinámico por entidad" que ya usa el backend
 * en sync.service.ts (`table as never`) — no introduce `any`.
 */
function asDynamicTable<T extends { id: string }>(table: EntityTable<T, 'id'>): Table<Record<string, unknown>, string> {
  return table as unknown as Table<Record<string, unknown>, string>;
}

/**
 * Tablas que participan del sync con el backend (mismas claves que el mapa
 * `tables` de apps/api/src/modules/sync/sync.service.ts). Se usa para poder
 * escribir localmente el registro autoritativo que manda el servidor cuando
 * un conflicto de LWW se resuelve a favor del servidor.
 */
const syncableTables: Record<string, Table<Record<string, unknown>, string>> = {
  accounts: asDynamicTable(db.accounts),
  categories: asDynamicTable(db.categories),
  expenses: asDynamicTable(db.expenses),
  incomes: asDynamicTable(db.incomes),
  transfers: asDynamicTable(db.transfers),
  creditCards: asDynamicTable(db.creditCards),
  cardCharges: asDynamicTable(db.cardCharges),
  cardChargeInstallments: asDynamicTable(db.cardChargeInstallments),
  cardPayments: asDynamicTable(db.cardPayments),
  debts: asDynamicTable(db.debts),
  debtPayments: asDynamicTable(db.debtPayments),
  goals: asDynamicTable(db.goals),
  goalContributions: asDynamicTable(db.goalContributions),
  investments: asDynamicTable(db.investments),
  investmentTransactions: asDynamicTable(db.investmentTransactions),
  budgets: asDynamicTable(db.budgets),
};

const DATE_FIELDS = ['createdAt', 'updatedAt', 'deletedAt'] as const;

/** El JSON del servidor trae las fechas como string ISO; Dexie las espera como Date. */
function normalizeServerRecord(record: Record<string, unknown>): Record<string, unknown> {
  const normalized: Record<string, unknown> = { ...record };
  for (const field of DATE_FIELDS) {
    const value = normalized[field];
    if (typeof value === 'string') {
      normalized[field] = new Date(value);
    }
  }
  return normalized;
}

/**
 * Sobrescribe el registro local con el dato autoritativo del servidor
 * (ganador de LWW). Usado cuando /api/sync devuelve status 'conflicted'.
 */
export async function applyServerRecord(
  entity: string,
  id: string,
  record: Record<string, unknown>
): Promise<void> {
  const table = syncableTables[entity];
  if (!table) return;
  await table.put({ ...normalizeServerRecord(record), id });
}
