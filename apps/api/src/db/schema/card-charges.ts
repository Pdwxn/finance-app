import { pgTable, uuid, text, bigint, integer, boolean, numeric, timestamp, date } from 'drizzle-orm/pg-core';
import { creditCards } from './credit-cards';
import { categories } from './categories';

export const cardCharges = pgTable('card_charges', {
  id: uuid('id').primaryKey().defaultRandom(),
  creditCardId: uuid('credit_card_id').notNull().references(() => creditCards.id, { onDelete: 'restrict' }),
  categoryId: uuid('category_id').notNull().references(() => categories.id, { onDelete: 'restrict' }),
  amount: bigint('amount', { mode: 'number' }).notNull(),
  description: text('description').notNull(),
  transactionDate: date('transaction_date').notNull(),
  isInstallment: boolean('is_installment').notNull().default(false),
  totalInstallments: integer('total_installments'),
  installmentAmount: bigint('installment_amount', { mode: 'number' }),
  interestRate: numeric('interest_rate'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});
