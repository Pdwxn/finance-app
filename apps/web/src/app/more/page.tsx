'use client';

import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DocumentTextIcon, CreditCardIcon, ExclamationTriangleIcon, BoltIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';

const sections = [
  { label: 'Reportes', href: '/reports', icon: DocumentTextIcon },
  { label: 'Tarjetas de crédito', href: '/credit-cards', icon: CreditCardIcon },
  { label: 'Deudas', href: '/debts', icon: ExclamationTriangleIcon },
  { label: 'Metas', href: '/goals', icon: BoltIcon },
  { label: 'Inversiones', href: '/investments', icon: ArrowTrendingUpIcon },
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
                <s.icon className="w-[18px] h-[18px] text-[var(--color-primary)]" />
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
