'use client';

import { useRouter, usePathname } from 'next/navigation';
import { ChevronLeftIcon, MoonIcon, SunIcon } from '@heroicons/react/24/outline';
import { useTheme } from './ThemeProvider';

const ROUTE_TITLES: Record<string, string> = {
  '/dashboard': 'Resumen',
  '/accounts': 'Cuentas',
  '/credit-cards': 'Tarjetas de crédito',
  '/debts': 'Deudas',
  '/goals': 'Metas',
  '/investments': 'Inversiones',
  '/budgets': 'Presupuestos',
  '/categories': 'Categorías',
  '/transactions': 'Transacciones',
  '/reports': 'Reportes',
  '/reports/ai': 'Resúmenes IA',
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

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-2 min-h-16 pt-[env(safe-area-inset-top)]">
      {showBack && (
        <button onClick={() => router.back()}
          className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)] transition-colors shrink-0"
          aria-label="Volver">
          <ChevronLeftIcon className="w-5 h-5" />
        </button>
      )}
      <div className={`flex-1 min-w-0 flex flex-col justify-center gap-0.5 py-2 ${showBack ? '' : 'pl-2'}`}>
        <img
          src={theme === 'dark' ? '/brand/hor-logo-dark.svg' : '/brand/hor-logo-light.svg'}
          alt="Numa"
          className="h-4 w-auto object-contain select-none"
        />
        <h1 suppressHydrationWarning className="text-sm font-semibold text-[var(--color-text)] truncate leading-tight">{title}</h1>
      </div>
      <button
        onClick={toggle}
        className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)] transition-colors shrink-0"
        aria-label="Toggle theme"
      >
        {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
      </button>
    </header>
  );
}
