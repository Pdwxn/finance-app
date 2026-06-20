import { eq, and, isNull } from 'drizzle-orm';
import { db } from '../../config/db';
import { accounts } from '../../db/schema/accounts';

export async function findAll(userId: string) {
  return db
    .select()
    .from(accounts)
    .where(and(eq(accounts.userId, userId), isNull(accounts.deletedAt)));
}

export async function findById(id: string, userId: string) {
  const result = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.id, id), eq(accounts.userId, userId), isNull(accounts.deletedAt)))
    .limit(1);
  return result[0] ?? null;
}

export async function create(data: typeof accounts.$inferInsert) {
  const result = await db.insert(accounts).values(data).returning();
  return result[0] ?? null;
}

export async function update(id: string, userId: string, data: Partial<typeof accounts.$inferInsert>) {
  const result = await db
    .update(accounts)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(accounts.id, id), eq(accounts.userId, userId)))
    .returning();
  return result[0] ?? null;
}

export async function softDelete(id: string, userId: string) {
  const result = await db
    .update(accounts)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(accounts.id, id), eq(accounts.userId, userId)))
    .returning();
  return result[0] ?? null;
}
