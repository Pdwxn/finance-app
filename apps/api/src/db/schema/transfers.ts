import { pgTable, uuid, text, bigint, timestamp, date } from 'drizzle-orm/pg-core';
import { users } from './users';
import { accounts } from './accounts';

export const transfers = pgTable('transfers', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  fromAccountId: uuid('from_account_id').notNull().references(() => accounts.id, { onDelete: 'restrict' }),
  toAccountId: uuid('to_account_id').notNull().references(() => accounts.id, { onDelete: 'restrict' }),
  amount: bigint('amount', { mode: 'number' }).notNull(),
  description: text('description').notNull(),
  transactionDate: date('transaction_date').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});
