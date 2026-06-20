import { eq, and, isNull } from 'drizzle-orm';
import { db } from '../../config/db';
import { debtPayments } from '../../db/schema/debt-payments';

export function findAll() {
  return db
    .select()
    .from(debtPayments)
    .where(isNull(debtPayments.deletedAt));
}

export async function findById(id: string) {
  const result = await db
    .select()
    .from(debtPayments)
    .where(and(eq(debtPayments.id, id), isNull(debtPayments.deletedAt)))
    .limit(1);
  return result[0] ?? null;
}

export async function create(data: typeof debtPayments.$inferInsert) {
  const result = await db.insert(debtPayments).values(data).returning();
  return result[0] ?? null;
}

export async function update(id: string, data: Partial<typeof debtPayments.$inferInsert>) {
  const result = await db
    .update(debtPayments)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(debtPayments.id, id))
    .returning();
  return result[0] ?? null;
}

export async function softDelete(id: string) {
  const result = await db
    .update(debtPayments)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(debtPayments.id, id))
    .returning();
  return result[0] ?? null;
}
