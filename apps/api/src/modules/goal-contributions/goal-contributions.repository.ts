import { eq, and, isNull } from 'drizzle-orm';
import { db } from '../../config/db';
import { goalContributions } from '../../db/schema/goal-contributions';

export function findAll() {
  return db
    .select()
    .from(goalContributions)
    .where(isNull(goalContributions.deletedAt));
}

export async function findById(id: string) {
  const result = await db
    .select()
    .from(goalContributions)
    .where(and(eq(goalContributions.id, id), isNull(goalContributions.deletedAt)))
    .limit(1);
  return result[0] ?? null;
}

export async function create(data: typeof goalContributions.$inferInsert) {
  const result = await db.insert(goalContributions).values(data).returning();
  return result[0] ?? null;
}

export async function update(id: string, data: Partial<typeof goalContributions.$inferInsert>) {
  const result = await db
    .update(goalContributions)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(goalContributions.id, id))
    .returning();
  return result[0] ?? null;
}

export async function softDelete(id: string) {
  const result = await db
    .update(goalContributions)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(goalContributions.id, id))
    .returning();
  return result[0] ?? null;
}
