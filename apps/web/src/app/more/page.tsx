'use client';

import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';

const sections = [
  { label: 'Tarjetas de crédito', href: '/credit-cards', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
  { label: 'Deudas', href: '#', icon: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { label: 'Metas', href: '#', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
  { label: 'Inversiones', href: '#', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
];

export default function MorePage() {
  return (
    <ProtectedRoute>
      <div className="p-4">
        <h2 className="text-xl font-semibold text-[var(--color-text)] mb-4">Más</h2>
        <div className="flex flex-col gap-1">
          {sections.map(s => (
            <Link
              key={s.label}
              href={s.href}
              className="flex items-center gap-3 rounded-xl bg-[var(--color-surface)] p-4 border border-[var(--color-border)] hover:bg-[var(--color-surface-alt)] transition-colors"
            >
              <div className="flex items-center justify-center w-9 h-9 rounded-full bg-[var(--color-surface-alt)]">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--color-primary)]">
                  <path d={s.icon} />
                </svg>
              </div>
              <span className="text-sm font-medium text-[var(--color-text)]">{s.label}</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-auto text-[var(--color-text-secondary)]">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
          ))}
        </div>
      </div>
    </ProtectedRoute>
  );
}
