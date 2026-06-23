'use client';

import { MoonIcon, SunIcon } from '@heroicons/react/24/outline';
import { useTheme } from './ThemeProvider';

export function TopBar() {
  const { theme, toggle } = useTheme();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 h-14">
      <div className="flex items-center h-7 select-none">
        <img
          src={theme === 'dark' ? '/brand/hor-logo-dark.svg' : '/brand/hor-logo-light.svg'}
          alt="Finance App"
          className="h-full w-auto object-contain"
        />
      </div>
      <button
        onClick={toggle}
        className="flex items-center justify-center w-10 h-10 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)] transition-colors"
        aria-label="Toggle theme"
      >
        {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
      </button>
    </header>
  );
}
