import { eq, and, isNull } from 'drizzle-orm';
import { db } from '../../config/db';
import { transfers } from '../../db/schema/transfers';

export function findAll(userId: string) {
  return db
    .select()
    .from(transfers)
    .where(and(eq(transfers.userId, userId), isNull(transfers.deletedAt)));
}

export async function findById(id: string, userId: string) {
  const result = await db
    .select()
    .from(transfers)
    .where(and(eq(transfers.id, id), eq(transfers.userId, userId), isNull(transfers.deletedAt)))
    .limit(1);
  return result[0] ?? null;
}

export async function create(data: typeof transfers.$inferInsert) {
  const result = await db.insert(transfers).values(data).returning();
  return result[0] ?? null;
}

export async function update(id: string, userId: string, data: Partial<typeof transfers.$inferInsert>) {
  const result = await db
    .update(transfers)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(transfers.id, id), eq(transfers.userId, userId)))
    .returning();
  return result[0] ?? null;
}

export async function softDelete(id: string, userId: string) {
  const result = await db
    .update(transfers)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(transfers.id, id), eq(transfers.userId, userId)))
    .returning();
  return result[0] ?? null;
}
