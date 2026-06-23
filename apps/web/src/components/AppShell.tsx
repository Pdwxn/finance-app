'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { startSync, statusStore } from '@finance-app/offline';
import { Toaster } from 'sonner';
import { TopBar } from './TopBar';
import { BottomNav } from './BottomNav';
import { SyncStatusIndicator } from './SyncStatusIndicator';
import { PwaRegister } from './PwaRegister';

const authPaths = new Set(['/login', '/register']);

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuth = authPaths.has(pathname);
  const [syncStatus, setSyncStatus] = useState(statusStore.status);

  useEffect(() => {
    startSync();
  }, []);

  useEffect(() => {
    const unsub = statusStore.subscribe(s => setSyncStatus(s));
    return unsub;
  }, []);

  if (isAuth) {
    return <>{children}</>;
  }

  const isOffline = syncStatus !== 'online';

  return (
    <>
      <PwaRegister />
      <TopBar />
      <SyncStatusIndicator />
      <main className={`${isOffline ? 'pt-20' : 'pt-14'} pb-[calc(4.5rem+env(safe-area-inset-bottom))] min-h-screen`}>{children}</main>
      <BottomNav />
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            border: '1px solid var(--color-border)',
          },
        }}
      />
    </>
  );
}
