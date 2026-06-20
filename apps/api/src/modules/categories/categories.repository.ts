import { eq, and, isNull } from 'drizzle-orm';
import { db } from '../../config/db';
import { categories } from '../../db/schema/categories';

export function findAll(userId: string) {
  return db
    .select()
    .from(categories)
    .where(and(eq(categories.userId, userId), isNull(categories.deletedAt)));
}

export async function findById(id: string, userId: string) {
  const result = await db
    .select()
    .from(categories)
    .where(and(eq(categories.id, id), eq(categories.userId, userId), isNull(categories.deletedAt)))
    .limit(1);
  return result[0] ?? null;
}

export async function create(data: typeof categories.$inferInsert) {
  const result = await db.insert(categories).values(data).returning();
  return result[0] ?? null;
}

export async function update(id: string, userId: string, data: Partial<typeof categories.$inferInsert>) {
  const result = await db
    .update(categories)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(categories.id, id), eq(categories.userId, userId)))
    .returning();
  return result[0] ?? null;
}

export async function softDelete(id: string, userId: string) {
  const result = await db
    .update(categories)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(categories.id, id), eq(categories.userId, userId)))
    .returning();
  return result[0] ?? null;
}
