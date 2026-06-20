import { eq, and, isNull } from 'drizzle-orm';
import { db } from '../../config/db';
import { cardCharges } from '../../db/schema/card-charges';

export function findAll() {
  return db
    .select()
    .from(cardCharges)
    .where(isNull(cardCharges.deletedAt));
}

export async function findById(id: string) {
  const result = await db
    .select()
    .from(cardCharges)
    .where(and(eq(cardCharges.id, id), isNull(cardCharges.deletedAt)))
    .limit(1);
  return result[0] ?? null;
}

export async function create(data: typeof cardCharges.$inferInsert) {
  const result = await db.insert(cardCharges).values(data).returning();
  return result[0] ?? null;
}

export async function update(id: string, data: Partial<typeof cardCharges.$inferInsert>) {
  const result = await db
    .update(cardCharges)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(cardCharges.id, id))
    .returning();
  return result[0] ?? null;
}

export async function softDelete(id: string) {
  const result = await db
    .update(cardCharges)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(cardCharges.id, id))
    .returning();
  return result[0] ?? null;
}
