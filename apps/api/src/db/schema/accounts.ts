import { pgTable, uuid, text, bigint, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';

export const accounts = pgTable('accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  name: text('name').notNull(),
  type: text('type').notNull(),
  currency: text('currency').notNull(),
  initialBalance: bigint('initial_balance', { mode: 'number' }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});
