import { eq, and, isNull } from 'drizzle-orm';
import { db } from '../../config/db';
import { cardPayments } from '../../db/schema/card-payments';

export function findAll() {
  return db
    .select()
    .from(cardPayments)
    .where(isNull(cardPayments.deletedAt));
}

export async function findById(id: string) {
  const result = await db
    .select()
    .from(cardPayments)
    .where(and(eq(cardPayments.id, id), isNull(cardPayments.deletedAt)))
    .limit(1);
  return result[0] ?? null;
}

export async function create(data: typeof cardPayments.$inferInsert) {
  const result = await db.insert(cardPayments).values(data).returning();
  return result[0] ?? null;
}

export async function update(id: string, data: Partial<typeof cardPayments.$inferInsert>) {
  const result = await db
    .update(cardPayments)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(cardPayments.id, id))
    .returning();
  return result[0] ?? null;
}

export async function softDelete(id: string) {
  const result = await db
    .update(cardPayments)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(cardPayments.id, id))
    .returning();
  return result[0] ?? null;
}
