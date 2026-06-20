import { eq, and, isNull } from 'drizzle-orm';
import { db } from '../../config/db';
import { debts } from '../../db/schema/debts';

export function findAll(userId: string) {
  return db
    .select()
    .from(debts)
    .where(and(eq(debts.userId, userId), isNull(debts.deletedAt)));
}

export async function findById(id: string, userId: string) {
  const result = await db
    .select()
    .from(debts)
    .where(and(eq(debts.id, id), eq(debts.userId, userId), isNull(debts.deletedAt)))
    .limit(1);
  return result[0] ?? null;
}

export async function create(data: typeof debts.$inferInsert) {
  const result = await db.insert(debts).values(data).returning();
  return result[0] ?? null;
}

export async function update(id: string, userId: string, data: Partial<typeof debts.$inferInsert>) {
  const result = await db
    .update(debts)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(debts.id, id), eq(debts.userId, userId)))
    .returning();
  return result[0] ?? null;
}

export async function softDelete(id: string, userId: string) {
  const result = await db
    .update(debts)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(debts.id, id), eq(debts.userId, userId)))
    .returning();
  return result[0] ?? null;
}
