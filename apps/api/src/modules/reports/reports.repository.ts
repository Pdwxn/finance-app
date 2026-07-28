import { and, eq, isNull, desc } from 'drizzle-orm';
import { db } from '../../config/db';
import { financialReports } from '../../db/schema/financial-reports';

export function findAll(userId: string, type?: string, page = 1, limit = 20) {
  const conditions = [
    eq(financialReports.userId, userId),
    isNull(financialReports.deletedAt),
  ];
  if (type) conditions.push(eq(financialReports.type, type));

  return db
    .select()
    .from(financialReports)
    .where(and(...conditions))
    .orderBy(desc(financialReports.createdAt))
    .offset((page - 1) * limit)
    .limit(limit);
}

export function countAll(userId: string, type?: string) {
  const conditions = [
    eq(financialReports.userId, userId),
    isNull(financialReports.deletedAt),
  ];
  if (type) conditions.push(eq(financialReports.type, type));

  return db
    .select({ count: financialReports.id })
    .from(financialReports)
    .where(and(...conditions));
}

export async function findById(id: string, userId: string) {
  const result = await db
    .select()
    .from(financialReports)
    .where(and(
      eq(financialReports.id, id),
      eq(financialReports.userId, userId),
      isNull(financialReports.deletedAt),
    ))
    .limit(1);
  return result[0] ?? null;
}

export async function countUnread(userId: string) {
  const result = await db
    .select({ count: financialReports.id })
    .from(financialReports)
    .where(and(
      eq(financialReports.userId, userId),
      isNull(financialReports.deletedAt),
    ));
  return result.length;
}

export async function softDelete(id: string, userId: string) {
  const result = await db
    .update(financialReports)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(financialReports.id, id), eq(financialReports.userId, userId)))
    .returning();
  return result[0] ?? null;
}
