import { eq, and, isNull } from 'drizzle-orm';
import { db } from '../../config/db';
import { goals } from '../../db/schema/goals';

export function findAll(userId: string) {
  return db
    .select()
    .from(goals)
    .where(and(eq(goals.userId, userId), isNull(goals.deletedAt)));
}

export async function findById(id: string, userId: string) {
  const result = await db
    .select()
    .from(goals)
    .where(and(eq(goals.id, id), eq(goals.userId, userId), isNull(goals.deletedAt)))
    .limit(1);
  return result[0] ?? null;
}

export async function create(data: typeof goals.$inferInsert) {
  const result = await db.insert(goals).values(data).returning();
  return result[0] ?? null;
}

export async function update(id: string, userId: string, data: Partial<typeof goals.$inferInsert>) {
  const result = await db
    .update(goals)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(goals.id, id), eq(goals.userId, userId)))
    .returning();
  return result[0] ?? null;
}

export async function softDelete(id: string, userId: string) {
  const result = await db
    .update(goals)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(goals.id, id), eq(goals.userId, userId)))
    .returning();
  return result[0] ?? null;
}
