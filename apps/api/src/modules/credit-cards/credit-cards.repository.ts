import { eq, and, isNull } from 'drizzle-orm';
import { db } from '../../config/db';
import { creditCards } from '../../db/schema/credit-cards';

export function findAll(userId: string) {
  return db
    .select()
    .from(creditCards)
    .where(and(eq(creditCards.userId, userId), isNull(creditCards.deletedAt)));
}

export async function findById(id: string, userId: string) {
  const result = await db
    .select()
    .from(creditCards)
    .where(and(eq(creditCards.id, id), eq(creditCards.userId, userId), isNull(creditCards.deletedAt)))
    .limit(1);
  return result[0] ?? null;
}

export async function create(data: typeof creditCards.$inferInsert) {
  const result = await db.insert(creditCards).values(data).returning();
  return result[0] ?? null;
}

export async function update(id: string, userId: string, data: Partial<typeof creditCards.$inferInsert>) {
  const result = await db
    .update(creditCards)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(creditCards.id, id), eq(creditCards.userId, userId)))
    .returning();
  return result[0] ?? null;
}

export async function softDelete(id: string, userId: string) {
  const result = await db
    .update(creditCards)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(creditCards.id, id), eq(creditCards.userId, userId)))
    .returning();
  return result[0] ?? null;
}
