import { pgTable, uuid, text, bigint, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { users } from './users';
import { categories } from './categories';

export const budgets = pgTable('budgets', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  categoryId: uuid('category_id').notNull().references(() => categories.id, { onDelete: 'restrict' }),
  period: text('period').notNull(),
  limitAmount: bigint('limit_amount', { mode: 'number' }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  userCategoryPeriodIdx: uniqueIndex('idx_budgets_user_cat_period').on(table.userId, table.categoryId, table.period),
}));
