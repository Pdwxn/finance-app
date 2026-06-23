'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { startSync } from '@finance-app/offline';
import { Toaster } from 'sonner';
import { TopBar } from './TopBar';
import { BottomNav } from './BottomNav';
import { SyncStatusIndicator } from './SyncStatusIndicator';
import { PwaRegister } from './PwaRegister';

const authPaths = new Set(['/login', '/register']);

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuth = authPaths.has(pathname);

  useEffect(() => {
    startSync();
  }, []);

  if (isAuth) {
    return <>{children}</>;
  }

  return (
    <>
      <PwaRegister />
      <TopBar />
      <SyncStatusIndicator />
      <main className="pt-14 pb-[calc(4.5rem+env(safe-area-inset-bottom))] min-h-screen">{children}</main>
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
