export type OnlineStatus = 'online' | 'offline' | 'syncing';

type StatusListener = (status: OnlineStatus) => void;
type SyncErrorListener = (message: string) => void;

class StatusStore {
  private _status: OnlineStatus = 'online';
  private listeners: Set<StatusListener> = new Set();
  private errorListeners: Set<SyncErrorListener> = new Set();

  constructor() {
    if (typeof window === 'undefined') return;
    this._status = navigator.onLine ? 'online' : 'offline';
    window.addEventListener('online', () => this.setStatus('online'));
    window.addEventListener('offline', () => this.setStatus('offline'));
  }

  get status(): OnlineStatus {
    return this._status;
  }

  setSyncing(syncing: boolean): void {
    if (syncing) {
      this.setStatus('syncing');
    } else {
      this.setStatus(navigator.onLine ? 'online' : 'offline');
    }
  }

  subscribe(listener: StatusListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Un item de sync falló con error de negocio (no transporte/auth — esos ya
   * se reintentan solos). Sin esto, en un celular sin acceso a DevTools no
   * hay forma de ver por qué: queda enterrado en el IndexedDB del dispositivo.
   */
  reportSyncError(message: string): void {
    this.errorListeners.forEach(fn => fn(message));
  }

  subscribeToErrors(listener: SyncErrorListener): () => void {
    this.errorListeners.add(listener);
    return () => {
      this.errorListeners.delete(listener);
    };
  }

  private setStatus(status: OnlineStatus): void {
    if (this._status === status) return;
    this._status = status;
    this.listeners.forEach(fn => fn(status));
  }
}

export const statusStore = new StatusStore();
