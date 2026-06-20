import { getPending, markSyncing, markCompleted, markFailed } from './sync-queue';
import { statusStore } from './status-store';

const SYNC_INTERVAL_MS = 30_000;

let intervalId: ReturnType<typeof setInterval> | null = null;

async function processQueue(): Promise<void> {
  if (!navigator.onLine) return;

  const pending = await getPending();
  if (pending.length === 0) return;

  statusStore.setSyncing(true);

  try {
    const operations = pending.map(item => ({
      id: item.id,
      operation: item.operation,
      entity: item.entity,
      entityId: item.entityId,
      payload: item.payload as Record<string, unknown>,
    }));

    const token = localStorage.getItem('jwt');
    if (!token) {
      statusStore.setSyncing(false);
      return;
    }

    for (const op of pending) {
      await markSyncing(op.id);
    }

    const response = await fetch('/api/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ operations }),
    });

    if (!response.ok) {
      for (const op of pending) {
        await markFailed(op.id);
      }
      statusStore.setSyncing(false);
      return;
    }

    const result = await response.json() as { data: { results: Array<{ queueId: string; status: string }> } };
    const results = result.data.results;

    for (const r of results) {
      if (r.status === 'applied') {
        await markCompleted(r.queueId);
      } else {
        await markFailed(r.queueId);
      }
    }
  } catch {
    const pendingItems = await getPending();
    for (const item of pendingItems) {
      if (item.status === 'syncing') {
        await markFailed(item.id);
      }
    }
  } finally {
    statusStore.setSyncing(false);
  }
}

export function startSync(): void {
  if (intervalId) return;

  processQueue();
  intervalId = setInterval(processQueue, SYNC_INTERVAL_MS);
}

export function stopSync(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

export function triggerSync(): Promise<void> {
  return processQueue();
}
