import { pgTable, uuid, text, bigint, integer, timestamp } from 'drizzle-orm/pg-core';
import { cardCharges } from './card-charges';
import { creditCards } from './credit-cards';

export const cardChargeInstallments = pgTable('card_charge_installments', {
  id: uuid('id').primaryKey().defaultRandom(),
  cardChargeId: uuid('card_charge_id').notNull().references(() => cardCharges.id, { onDelete: 'cascade' }),
  creditCardId: uuid('credit_card_id').notNull().references(() => creditCards.id, { onDelete: 'restrict' }),
  installmentNumber: integer('installment_number').notNull(),
  amount: bigint('amount', { mode: 'number' }).notNull(),
  duePeriod: text('due_period').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});
