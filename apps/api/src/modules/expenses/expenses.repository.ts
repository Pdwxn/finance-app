import { eq, and, isNull } from 'drizzle-orm';
import { db } from '../../config/db';
import { expenses } from '../../db/schema/expenses';

export function findAll(userId: string) {
  return db
    .select()
    .from(expenses)
    .where(and(eq(expenses.userId, userId), isNull(expenses.deletedAt)));
}

export async function findById(id: string, userId: string) {
  const result = await db
    .select()
    .from(expenses)
    .where(and(eq(expenses.id, id), eq(expenses.userId, userId), isNull(expenses.deletedAt)))
    .limit(1);
  return result[0] ?? null;
}

export async function create(data: typeof expenses.$inferInsert) {
  const result = await db.insert(expenses).values(data).returning();
  return result[0] ?? null;
}

export async function update(id: string, userId: string, data: Partial<typeof expenses.$inferInsert>) {
  const result = await db
    .update(expenses)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(expenses.id, id), eq(expenses.userId, userId)))
    .returning();
  return result[0] ?? null;
}

export async function softDelete(id: string, userId: string) {
  const result = await db
    .update(expenses)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(expenses.id, id), eq(expenses.userId, userId)))
    .returning();
  return result[0] ?? null;
}
