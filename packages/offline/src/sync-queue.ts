import { db } from './db';
import type { SyncQueueItem } from './db';

export type QueueOperation = 'create' | 'update' | 'delete';

export async function enqueue(
  operation: QueueOperation,
  entity: string,
  entityId: string,
  payload: unknown
): Promise<void> {
  const now = new Date();
  await db.syncQueue.add({
    id: crypto.randomUUID(),
    operation,
    entity,
    entityId,
    payload,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  });
}

export async function getPending(): Promise<SyncQueueItem[]> {
  return db.syncQueue
    .where('status')
    .equals('pending')
    .toArray();
}

export async function markSyncing(id: string): Promise<void> {
  await db.syncQueue.update(id, { status: 'syncing', updatedAt: new Date() });
}

export async function markCompleted(id: string): Promise<void> {
  await db.syncQueue.update(id, { status: 'completed', updatedAt: new Date() });
}

export async function markFailed(id: string): Promise<void> {
  await db.syncQueue.update(id, { status: 'failed', updatedAt: new Date() });
}

export async function removeCompleted(): Promise<void> {
  await db.syncQueue
    .where('status')
    .equals('completed')
    .delete();
}

export async function clearAll(): Promise<void> {
  await db.syncQueue.clear();
}

export async function countPending(): Promise<number> {
  return db.syncQueue
    .where('status')
    .equals('pending')
    .count();
}
