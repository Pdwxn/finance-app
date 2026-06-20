import { eq, and, isNull } from 'drizzle-orm';
import { db } from '../../config/db';
import { investmentTransactions } from '../../db/schema/investment-transactions';

export function findAll() {
  return db
    .select()
    .from(investmentTransactions)
    .where(isNull(investmentTransactions.deletedAt));
}

export async function findById(id: string) {
  const result = await db
    .select()
    .from(investmentTransactions)
    .where(and(eq(investmentTransactions.id, id), isNull(investmentTransactions.deletedAt)))
    .limit(1);
  return result[0] ?? null;
}

export async function create(data: typeof investmentTransactions.$inferInsert) {
  const result = await db.insert(investmentTransactions).values(data).returning();
  return result[0] ?? null;
}

export async function update(id: string, data: Partial<typeof investmentTransactions.$inferInsert>) {
  const result = await db
    .update(investmentTransactions)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(investmentTransactions.id, id))
    .returning();
  return result[0] ?? null;
}

export async function softDelete(id: string) {
  const result = await db
    .update(investmentTransactions)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(investmentTransactions.id, id))
    .returning();
  return result[0] ?? null;
}
