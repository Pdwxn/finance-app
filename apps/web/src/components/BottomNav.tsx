'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HomeIcon, CreditCardIcon, ArrowsRightLeftIcon, EllipsisHorizontalIcon } from '@heroicons/react/24/outline';

const navItems = [
  { label: 'Dashboard', href: '/', icon: HomeIcon },
  { label: 'Accounts', href: '/accounts', icon: CreditCardIcon },
  { label: 'Transactions', href: '/transactions', icon: ArrowsRightLeftIcon },
  { label: 'More', href: '/more', icon: EllipsisHorizontalIcon },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-[var(--color-border)] bg-[var(--color-surface)] h-[calc(4.5rem+env(safe-area-inset-bottom))] pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-2">
      {navItems.map(item => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.label}
            href={item.href}
            className={`flex flex-col items-center justify-center gap-0.5 min-w-[44px] min-h-[44px] transition-colors ${
              isActive ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]'
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px]">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
