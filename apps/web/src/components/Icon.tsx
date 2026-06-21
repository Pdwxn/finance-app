import type { ComponentProps, ReactNode } from 'react';

type HeroIcon = (props: ComponentProps<'svg'>) => ReactNode;

interface IconProps extends ComponentProps<'svg'> {
  icon: HeroIcon;
}

export function Icon({ icon: IconComponent, className, ...props }: IconProps) {
  return <IconComponent className={className} {...props} />;
}
