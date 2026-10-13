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

/**
 * Si un item lleva más de esto en 'syncing', el intento anterior se
 * interrumpió (app cerrada, red caída a mitad de la request) antes de poder
 * marcarlo completed/failed/pending — no es que siga realmente en vuelo.
 * Dos veces el intervalo de sync (ver SYNC_INTERVAL_MS en sync-manager.ts)
 * es margen de sobra para una request real en curso.
 */
const STALE_SYNCING_MS = 60_000;

/**
 * Trae los items a sincronizar. Incluye 'failed' junto con 'pending': no hay
 * backoff ni límite de reintentos en este sync manager (por diseño, sigue el
 * mismo principio simple de LWW de CLAUDE.md), así que un item marcado como
 * 'failed' por una falla transitoria (red, token expirado) debe reintentarse
 * en el siguiente ciclo en vez de quedar perdido para siempre.
 *
 * También recupera los que quedaron atascados en 'syncing' (ver
 * STALE_SYNCING_MS) — si no, un request interrumpido a mitad de camino deja
 * ese item huérfano para siempre, sin reintento posible.
 */
export async function getPending(): Promise<SyncQueueItem[]> {
  const all = await db.syncQueue
    .where('status')
    .anyOf(['pending', 'failed', 'syncing'])
    .toArray();

  const staleCutoff = Date.now() - STALE_SYNCING_MS;
  return all.filter(item => item.status !== 'syncing' || item.updatedAt.getTime() < staleCutoff);
}

export async function markSyncing(id: string): Promise<void> {
  await db.syncQueue.update(id, { status: 'syncing', updatedAt: new Date() });
}

export async function markPending(id: string): Promise<void> {
  await db.syncQueue.update(id, { status: 'pending', updatedAt: new Date() });
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
