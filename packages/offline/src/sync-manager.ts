import { getPending, markSyncing, markPending, markCompleted, markFailed } from './sync-queue';
import { applyServerRecord } from './db';
import { resolveConflict } from './conflict-resolver';
import { statusStore } from './status-store';

const SYNC_INTERVAL_MS = 30_000;

interface SyncOpResult {
  queueId: string;
  status: 'applied' | 'conflicted' | 'error';
  entityId: string;
  serverData?: Record<string, unknown>;
  error?: string;
}

let intervalId: ReturnType<typeof setInterval> | null = null;

/**
 * El access token (JWT) dura 1h (ver auth.service.ts). Este manager corre en
 * segundo plano cada 30s independiente de lib/api.ts, así que necesita su
 * propio refresh: sin esto, pasada 1h desde el login cada sync fallaba con
 * 401 y los items quedaban marcados 'failed' para siempre (getPending ya no
 * los recuperaba), perdiendo gastos/ingresos silenciosamente de cara al
 * backend aunque la UI local los siguiera mostrando bien.
 */
async function attemptRefresh(): Promise<boolean> {
  const rt = localStorage.getItem('refreshToken');
  if (!rt) return false;
  try {
    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: rt }),
    });
    if (!res.ok) return false;
    const json = await res.json();
    if (!json.success || !json.data?.accessToken) return false;
    localStorage.setItem('jwt', json.data.accessToken);
    if (json.data.refreshToken) {
      localStorage.setItem('refreshToken', json.data.refreshToken);
    }
    return true;
  } catch {
    return false;
  }
}

function postSync(operations: unknown, token: string): Promise<Response> {
  return fetch('/api/sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ operations }),
  });
}

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
      // sync.schema.ts (backend) exige este campo; faltaba acá y provocaba
      // que CADA sync devolviera 400 (createdAt requerido), sin importar
      // los demás fixes — por eso nunca llegó nada a Postgres hasta ahora.
      createdAt: item.createdAt.toISOString(),
    }));

    let token = localStorage.getItem('jwt');
    if (!token) {
      statusStore.setSyncing(false);
      return;
    }

    for (const op of pending) {
      await markSyncing(op.id);
    }

    let response = await postSync(operations, token);

    if (response.status === 401) {
      const refreshed = await attemptRefresh();
      if (refreshed) {
        token = localStorage.getItem('jwt')!;
        response = await postSync(operations, token);
      }
    }

    if (!response.ok) {
      // Falla de transporte/autenticación: no es un error de negocio del
      // item, así que se reintenta en el próximo ciclo en vez de perderse.
      for (const op of pending) {
        await markPending(op.id);
      }
      statusStore.setSyncing(false);
      return;
    }

    const result = await response.json() as { data: { results: SyncOpResult[] } };
    const results = result.data.results;
    const byQueueId = new Map(pending.map(item => [item.id, item]));

    for (const r of results) {
      if (r.status === 'applied') {
        await markCompleted(r.queueId);
        continue;
      }

      if (r.status === 'conflicted' && r.serverData) {
        // LWW: el servidor (fuente de verdad, CLAUDE.md §5/§8) ya decidió que
        // su versión gana. Reflejamos ese dato localmente para que la UI deje
        // de mostrar el valor local obsoleto, en vez de reintentar para
        // siempre el mismo payload perdedor.
        const item = byQueueId.get(r.queueId);
        if (item) {
          const localUpdatedAt = (item.payload as Record<string, unknown>).updatedAt as string | undefined;
          const serverUpdatedAt = r.serverData.updatedAt as string | undefined;
          if (localUpdatedAt && serverUpdatedAt && resolveConflict(localUpdatedAt, serverUpdatedAt) === 'local_wins') {
            console.warn(`[sync] Conflicto en ${item.entity}/${item.entityId}: el cliente lo marcó como local_wins pero el servidor ya resolvió a favor de su propia versión; se adopta la versión del servidor.`);
          }
          await applyServerRecord(item.entity, item.entityId, r.serverData);
        }
        await markCompleted(r.queueId);
        continue;
      }

      await markFailed(r.queueId);
    }
  } catch {
    const pendingItems = await getPending();
    for (const item of pendingItems) {
      if (item.status === 'syncing') {
        await markPending(item.id);
      }
    }
  } finally {
    statusStore.setSyncing(false);
  }
}

/**
 * El sync hasta ahora dependía solo de este setInterval de 30s. En un
 * celular eso no basta: el navegador/iOS suspende timers en segundo plano
 * en cuanto la app deja de estar en primer plano, así que si el usuario
 * carga un gasto y minimiza la app, el intervalo puede no volver a correr
 * nunca. Disparamos también al reconectar y al volver a foreground, que es
 * exactamente el momento en que sí hay chance real de red + CPU.
 */
export function startSync(): void {
  if (intervalId) return;

  processQueue();
  intervalId = setInterval(processQueue, SYNC_INTERVAL_MS);

  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => { processQueue(); });
  }
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') processQueue();
    });
  }
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
