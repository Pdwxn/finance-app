import { pgTable, uuid, bigint, timestamp, date } from 'drizzle-orm/pg-core';
import { debts } from './debts';
import { accounts } from './accounts';

export const debtPayments = pgTable('debt_payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  debtId: uuid('debt_id').notNull().references(() => debts.id, { onDelete: 'restrict' }),
  accountId: uuid('account_id').notNull().references(() => accounts.id, { onDelete: 'restrict' }),
  amount: bigint('amount', { mode: 'number' }).notNull(),
  paymentDate: date('payment_date').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});
