import { pgTable, uuid, text, timestamp, date, jsonb } from 'drizzle-orm/pg-core';
import { users } from './users';

export const financialReports = pgTable('financial_reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  type: text('type').notNull(), // 'weekly' | 'monthly'
  periodStart: date('period_start').notNull(),
  periodEnd: date('period_end').notNull(),
  title: text('title').notNull(),
  summary: text('summary').notNull(),
  metadata: jsonb('metadata').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});
