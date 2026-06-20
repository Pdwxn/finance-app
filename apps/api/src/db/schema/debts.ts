import { pgTable, uuid, text, bigint, numeric, timestamp, date } from 'drizzle-orm/pg-core';
import { users } from './users';

export const debts = pgTable('debts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  name: text('name').notNull(),
  initialAmount: bigint('initial_amount', { mode: 'number' }).notNull(),
  interestRate: numeric('interest_rate').notNull(),
  startDate: date('start_date').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});
