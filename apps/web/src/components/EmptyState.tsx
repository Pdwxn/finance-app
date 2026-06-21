import type { ComponentProps, ReactNode } from 'react';

type HeroIcon = (props: ComponentProps<'svg'>) => ReactNode;

interface EmptyStateProps {
  icon: HeroIcon;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function EmptyState({ icon: IconComponent, title, subtitle, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center pt-16 text-center">
      <IconComponent className="w-12 h-12 text-[var(--color-text-secondary)] mb-4" strokeWidth={1.5} />
      <p className="text-[var(--color-text-secondary)] font-medium">{title}</p>
      {subtitle && <p className="text-sm text-[var(--color-text-secondary)] mt-1">{subtitle}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
