export type OnlineStatus = 'online' | 'offline' | 'syncing';

type StatusListener = (status: OnlineStatus) => void;

class StatusStore {
  private _status: OnlineStatus = navigator.onLine ? 'online' : 'offline';
  private listeners: Set<StatusListener> = new Set();

  constructor() {
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

  private setStatus(status: OnlineStatus): void {
    if (this._status === status) return;
    this._status = status;
    this.listeners.forEach(fn => fn(status));
  }
}

export const statusStore = new StatusStore();
