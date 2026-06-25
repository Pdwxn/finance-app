import { useEffect, useState, useRef } from 'react';
import { statusStore } from '@finance-app/offline';
import { ArrowPathIcon, WifiIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';

export function SyncStatusIndicator() {
  const [status, setStatus] = useState<'online' | 'offline' | 'syncing'>('online');
  const prevStatus = useRef(status);

  useEffect(() => {
    const unsub = statusStore.subscribe(s => {
      setStatus(s);
      if (prevStatus.current === 'offline' && s === 'online') {
        toast.success('Conexión restablecida');
      } else if (prevStatus.current === 'online' && s === 'offline') {
        toast.warning('Sin conexión — los cambios se guardarán localmente');
      }
      prevStatus.current = s;
    });
    setStatus(statusStore.status);
    prevStatus.current = statusStore.status;
    return unsub;
  }, []);

  if (status === 'online') return null;

  return (
    <div className={`fixed top-[calc(3.5rem+env(safe-area-inset-top))] left-0 right-0 z-40 flex items-center justify-center gap-1.5 py-1 text-xs font-medium ${
      status === 'syncing'
        ? 'bg-blue-500 text-white'
        : 'bg-amber-500 text-white'
    }`}>
      {status === 'syncing' ? (
        <>
          <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
          Sincronizando…
        </>
      ) : (
        <>
          <WifiIcon className="w-3.5 h-3.5" />
          Sin conexión
        </>
      )}
    </div>
  );
}
