import { eq, and, isNull } from 'drizzle-orm';
import { db } from '../../config/db';
import { budgets } from '../../db/schema/budgets';

export function findAll(userId: string) {
  return db
    .select()
    .from(budgets)
    .where(and(eq(budgets.userId, userId), isNull(budgets.deletedAt)));
}

export function findByPeriod(userId: string, period: string) {
  return db
    .select()
    .from(budgets)
    .where(and(eq(budgets.userId, userId), eq(budgets.period, period), isNull(budgets.deletedAt)));
}

export async function findById(id: string, userId: string) {
  const result = await db
    .select()
    .from(budgets)
    .where(and(eq(budgets.id, id), eq(budgets.userId, userId), isNull(budgets.deletedAt)))
    .limit(1);
  return result[0] ?? null;
}

export async function create(data: typeof budgets.$inferInsert) {
  const result = await db.insert(budgets).values(data).returning();
  return result[0] ?? null;
}

export async function update(id: string, userId: string, data: Partial<typeof budgets.$inferInsert>) {
  const result = await db
    .update(budgets)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(budgets.id, id), eq(budgets.userId, userId)))
    .returning();
  return result[0] ?? null;
}

export async function softDelete(id: string, userId: string) {
  const result = await db
    .update(budgets)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(budgets.id, id), eq(budgets.userId, userId)))
    .returning();
  return result[0] ?? null;
}
