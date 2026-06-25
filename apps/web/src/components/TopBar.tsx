'use client';

import { useRouter, usePathname } from 'next/navigation';
import { ChevronLeftIcon, MoonIcon, SunIcon } from '@heroicons/react/24/outline';
import { useTheme } from './ThemeProvider';

const ROUTE_TITLES: Record<string, string> = {
  '/': 'Resumen',
  '/accounts': 'Cuentas',
  '/credit-cards': 'Tarjetas de crédito',
  '/debts': 'Deudas',
  '/goals': 'Metas',
  '/investments': 'Inversiones',
  '/categories': 'Categorías',
  '/transactions': 'Transacciones',
  '/reports': 'Reportes',
  '/more': 'Más',
};

function getTitle(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length <= 1) {
    return ROUTE_TITLES[pathname] ?? 'Numa';
  }
  const parentPath = `/${segments[0]}`;
  return ROUTE_TITLES[parentPath] ?? 'Numa';
}

function isDetailPage(pathname: string): boolean {
  const segments = pathname.split('/').filter(Boolean);
  return segments.length >= 2;
}

export function TopBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const title = getTitle(pathname);
  const showBack = isDetailPage(pathname);

  if (pathname === '/') {
    return (
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 min-h-14 pt-[env(safe-area-inset-top)]">
        <div className="flex items-center h-7 select-none">
          <img
            src={theme === 'dark' ? '/brand/hor-logo-dark.svg' : '/brand/hor-logo-light.svg'}
            alt="Numa"
            className="h-full w-auto object-contain"
          />
        </div>
        <button
          onClick={toggle}
          className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)] transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
        </button>
      </header>
    );
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-2 min-h-14 pt-[env(safe-area-inset-top)]">
      {showBack && (
        <button onClick={() => router.back()}
          className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)] transition-colors"
          aria-label="Volver">
          <ChevronLeftIcon className="w-5 h-5" />
        </button>
      )}
      <h1 className="text-base font-semibold text-[var(--color-text)] flex-1 truncate">{title}</h1>
      <button
        onClick={toggle}
        className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)] transition-colors"
        aria-label="Toggle theme"
      >
        {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
      </button>
    </header>
  );
}
