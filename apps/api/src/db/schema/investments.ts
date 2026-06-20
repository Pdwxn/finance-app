import { pgTable, uuid, text, numeric, bigint, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';

export const investments = pgTable('investments', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  symbol: text('symbol').notNull(),
  name: text('name').notNull(),
  quantity: numeric('quantity').notNull(),
  averageCost: bigint('average_cost', { mode: 'number' }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});
