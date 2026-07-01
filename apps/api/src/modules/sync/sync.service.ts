import { eq } from 'drizzle-orm';
import { db } from '../../config/db';
import { accounts } from '../../db/schema/accounts';
import { categories } from '../../db/schema/categories';
import { expenses } from '../../db/schema/expenses';
import { incomes } from '../../db/schema/incomes';
import { transfers } from '../../db/schema/transfers';
import { creditCards } from '../../db/schema/credit-cards';
import { cardCharges } from '../../db/schema/card-charges';
import { cardChargeInstallments } from '../../db/schema/card-charge-installments';
import { cardPayments } from '../../db/schema/card-payments';
import { debts } from '../../db/schema/debts';
import { debtPayments } from '../../db/schema/debt-payments';
import { goals } from '../../db/schema/goals';
import { goalContributions } from '../../db/schema/goal-contributions';
import { investments } from '../../db/schema/investments';
import { investmentTransactions } from '../../db/schema/investment-transactions';
import { budgets } from '../../db/schema/budgets';

interface SyncResult {
  queueId: string;
  status: 'applied' | 'conflicted' | 'error';
  entityId: string;
  serverData?: Record<string, unknown>;
  error?: string;
}

const tables: Record<string, unknown> = {
  accounts,
  categories,
  expenses,
  incomes,
  transfers,
  creditCards,
  cardCharges,
  cardChargeInstallments,
  cardPayments,
  debts,
  debtPayments,
  goals,
  goalContributions,
  investments,
  investmentTransactions,
  budgets,
};

function findById(table: unknown, id: string): Promise<Record<string, unknown>[]> {
  const tbl = table as { id: unknown };
  return db.select().from(tbl as never).where(eq(tbl.id as never, id)).limit(1) as unknown as Promise<Record<string, unknown>[]>;
}

function insertRow(table: unknown, data: Record<string, unknown>): Promise<void> {
  return (db.insert(table as never).values(data as never).onConflictDoNothing() as unknown as Promise<void>);
}

function updateRow(table: unknown, id: string, data: Record<string, unknown>): Promise<void> {
  const tbl = table as { id: unknown };
  return (db.update(tbl as never).set(data as never).where(eq(tbl.id as never, id)) as unknown as Promise<void>);
}

function deleteRow(table: unknown, id: string): Promise<void> {
  const tbl = table as { id: unknown };
  return (db.update(tbl as never).set({ deletedAt: new Date(), updatedAt: new Date() } as never).where(eq(tbl.id as never, id)) as unknown as Promise<void>);
}

export async function processOperations(
  operations: Array<{ id: string; operation: string; entity: string; entityId: string; payload: Record<string, unknown> }>,
  userId: string
): Promise<SyncResult[]> {
  const results: SyncResult[] = [];

  for (const op of operations) {
    try {
      const table = tables[op.entity];
      if (!table) {
        results.push({ queueId: op.id, status: 'error', entityId: op.entityId, error: `Entidad desconocida: ${op.entity}` });
        continue;
      }

      const incomingUpdatedAt = op.payload.updatedAt
        ? new Date(op.payload.updatedAt as string)
        : new Date(0);

      const existing = await findById(table, op.entityId);
      const existingRecord = existing[0] ?? null;

      switch (op.operation) {
        case 'create': {
          if (existingRecord) {
            if (incomingUpdatedAt > (existingRecord.updatedAt as Date)) {
              await updateRow(table, op.entityId, { ...op.payload, updatedAt: incomingUpdatedAt });
              results.push({ queueId: op.id, status: 'applied', entityId: op.entityId });
            } else {
              results.push({ queueId: op.id, status: 'conflicted', entityId: op.entityId, serverData: existingRecord });
            }
          } else {
            await insertRow(table, { ...op.payload, id: op.entityId, userId });
            results.push({ queueId: op.id, status: 'applied', entityId: op.entityId });
          }
          break;
        }

        case 'update': {
          if (!existingRecord) {
            await insertRow(table, { ...op.payload, id: op.entityId, userId });
            results.push({ queueId: op.id, status: 'applied', entityId: op.entityId });
          } else {
            if (incomingUpdatedAt >= (existingRecord.updatedAt as Date)) {
              await updateRow(table, op.entityId, { ...op.payload, updatedAt: incomingUpdatedAt });
              results.push({ queueId: op.id, status: 'applied', entityId: op.entityId });
            } else {
              results.push({ queueId: op.id, status: 'conflicted', entityId: op.entityId, serverData: existingRecord });
            }
          }
          break;
        }

        case 'delete': {
          if (!existingRecord) {
            results.push({ queueId: op.id, status: 'applied', entityId: op.entityId });
          } else {
            if (incomingUpdatedAt >= (existingRecord.updatedAt as Date)) {
              await deleteRow(table, op.entityId);
              results.push({ queueId: op.id, status: 'applied', entityId: op.entityId });
            } else {
              results.push({ queueId: op.id, status: 'conflicted', entityId: op.entityId, serverData: existingRecord });
            }
          }
          break;
        }

        default:
          results.push({ queueId: op.id, status: 'error', entityId: op.entityId, error: `Operación desconocida: ${op.operation}` });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error interno';
      results.push({ queueId: op.id, status: 'error', entityId: op.entityId, error: message });
    }
  }

  return results;
}
