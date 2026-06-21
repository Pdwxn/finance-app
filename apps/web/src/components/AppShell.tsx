'use client';

import { usePathname } from 'next/navigation';
import { TopBar } from './TopBar';
import { BottomNav } from './BottomNav';

const authPaths = new Set(['/login', '/register']);

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuth = authPaths.has(pathname);

  if (isAuth) {
    return <>{children}</>;
  }

  return (
    <>
      <TopBar />
      <main className="pt-14 pb-16 min-h-screen">{children}</main>
      <BottomNav />
    </>
  );
}
