import { pgTable, uuid, text, bigint, integer, numeric, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';

export const creditCards = pgTable('credit_cards', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  name: text('name').notNull(),
  limitAmount: bigint('limit_amount', { mode: 'number' }).notNull(),
  closingDay: integer('closing_day').notNull(),
  dueDay: integer('due_day').notNull(),
  monthlyFee: bigint('monthly_fee', { mode: 'number' }),
  interestRate: numeric('interest_rate'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});
