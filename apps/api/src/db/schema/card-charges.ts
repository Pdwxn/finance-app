import { pgTable, uuid, text, bigint, timestamp, date } from 'drizzle-orm/pg-core';
import { creditCards } from './credit-cards';
import { categories } from './categories';

export const cardCharges = pgTable('card_charges', {
  id: uuid('id').primaryKey().defaultRandom(),
  creditCardId: uuid('credit_card_id').notNull().references(() => creditCards.id, { onDelete: 'restrict' }),
  categoryId: uuid('category_id').notNull().references(() => categories.id, { onDelete: 'restrict' }),
  amount: bigint('amount', { mode: 'number' }).notNull(),
  description: text('description').notNull(),
  transactionDate: date('transaction_date').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});
