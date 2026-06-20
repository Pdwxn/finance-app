import { eq, and, isNull } from 'drizzle-orm';
import { db } from '../../config/db';
import { incomes } from '../../db/schema/incomes';

export function findAll(userId: string) {
  return db
    .select()
    .from(incomes)
    .where(and(eq(incomes.userId, userId), isNull(incomes.deletedAt)));
}

export async function findById(id: string, userId: string) {
  const result = await db
    .select()
    .from(incomes)
    .where(and(eq(incomes.id, id), eq(incomes.userId, userId), isNull(incomes.deletedAt)))
    .limit(1);
  return result[0] ?? null;
}

export async function create(data: typeof incomes.$inferInsert) {
  const result = await db.insert(incomes).values(data).returning();
  return result[0] ?? null;
}

export async function update(id: string, userId: string, data: Partial<typeof incomes.$inferInsert>) {
  const result = await db
    .update(incomes)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(incomes.id, id), eq(incomes.userId, userId)))
    .returning();
  return result[0] ?? null;
}

export async function softDelete(id: string, userId: string) {
  const result = await db
    .update(incomes)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(incomes.id, id), eq(incomes.userId, userId)))
    .returning();
  return result[0] ?? null;
}
