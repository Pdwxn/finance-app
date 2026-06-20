import { pgTable, uuid, text, numeric, bigint, timestamp, date } from 'drizzle-orm/pg-core';
import { investments } from './investments';

export const investmentTransactions = pgTable('investment_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  investmentId: uuid('investment_id').notNull().references(() => investments.id, { onDelete: 'restrict' }),
  type: text('type').notNull(),
  quantity: numeric('quantity').notNull(),
  price: bigint('price', { mode: 'number' }).notNull(),
  transactionDate: date('transaction_date').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});
