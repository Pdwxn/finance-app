import Dexie, { type EntityTable } from 'dexie';

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

export type {
  Account,
  Category,
  Expense,
  Income,
  Transfer,
  CreditCard,
  CardCharge,
  CardPayment,
  Debt,
  DebtPayment,
  Goal,
  GoalContribution,
  Investment,
  InvestmentTransaction,
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
  cardPayments!: EntityTable<CardPayment, 'id'>;
  debts!: EntityTable<Debt, 'id'>;
  debtPayments!: EntityTable<DebtPayment, 'id'>;
  goals!: EntityTable<Goal, 'id'>;
  goalContributions!: EntityTable<GoalContribution, 'id'>;
  investments!: EntityTable<Investment, 'id'>;
  investmentTransactions!: EntityTable<InvestmentTransaction, 'id'>;
  syncQueue!: EntityTable<SyncQueueItem, 'id'>;

  constructor() {
    super('numa');

    this.version(1).stores({
      accounts: '&id, userId, [userId+createdAt]',
      categories: '&id, userId, [userId+createdAt]',
      expenses: '&id, userId, accountId, categoryId, [userId+createdAt], [userId+transactionDate]',
      incomes: '&id, userId, accountId, categoryId, [userId+createdAt], [userId+transactionDate]',
      transfers: '&id, userId, fromAccountId, toAccountId, [userId+createdAt], [userId+transactionDate]',
      creditCards: '&id, userId, [userId+createdAt]',
      cardCharges: '&id, creditCardId, categoryId, [creditCardId+createdAt]',
      cardPayments: '&id, creditCardId, accountId, [creditCardId+createdAt]',
      debts: '&id, userId, [userId+createdAt]',
      debtPayments: '&id, debtId, [debtId+createdAt]',
      goals: '&id, userId, [userId+createdAt]',
      goalContributions: '&id, goalId, accountId, [goalId+createdAt]',
      investments: '&id, userId, [userId+createdAt]',
      investmentTransactions: '&id, investmentId, [investmentId+createdAt]',
      syncQueue: '&id, status, entity, createdAt, [status+createdAt]',
    });
  }
}

export const db = new FinanceDB();
