import { eq, and, isNull } from 'drizzle-orm';
import { db } from '../../config/db';
import { investments } from '../../db/schema/investments';

export function findAll(userId: string) {
  return db
    .select()
    .from(investments)
    .where(and(eq(investments.userId, userId), isNull(investments.deletedAt)));
}

export async function findById(id: string, userId: string) {
  const result = await db
    .select()
    .from(investments)
    .where(and(eq(investments.id, id), eq(investments.userId, userId), isNull(investments.deletedAt)))
    .limit(1);
  return result[0] ?? null;
}

export async function create(data: typeof investments.$inferInsert) {
  const result = await db.insert(investments).values(data).returning();
  return result[0] ?? null;
}

export async function update(id: string, userId: string, data: Partial<typeof investments.$inferInsert>) {
  const result = await db
    .update(investments)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(investments.id, id), eq(investments.userId, userId)))
    .returning();
  return result[0] ?? null;
}

export async function softDelete(id: string, userId: string) {
  const result = await db
    .update(investments)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(investments.id, id), eq(investments.userId, userId)))
    .returning();
  return result[0] ?? null;
}
