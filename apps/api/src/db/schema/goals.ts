import { pgTable, uuid, text, bigint, timestamp, date } from 'drizzle-orm/pg-core';
import { users } from './users';

export const goals = pgTable('goals', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  name: text('name').notNull(),
  targetAmount: bigint('target_amount', { mode: 'number' }).notNull(),
  targetDate: date('target_date').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});
