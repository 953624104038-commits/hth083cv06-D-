import React from "react";
import type { LucideIcon } from "lucide-react";
type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'sm' | 'md' | 'lg';
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: LucideIcon;
}
const VARIANTS: Record<Variant, string> = {
  primary: 'bg-accent text-accent-ink hover:bg-accent-hover hover:scale-[1.03] active:scale-[0.98] font-bold',
  secondary: 'border border-line-strong text-ink hover:border-ink hover:scale-[1.02] active:scale-[0.98] font-bold',
  ghost: 'text-muted hover:text-ink hover:bg-raised font-semibold'
};
const SIZES: Record<Size, {
  text: string;
  icon: string;
  square: string;
}> = {
  sm: {
    text: 'h-8 px-3.5 text-[13px] gap-1.5',
    icon: 'h-4 w-4',
    square: 'h-8 w-8'
  },
  md: {
    text: 'h-10 px-5 text-sm gap-2',
    icon: 'h-4 w-4',
    square: 'h-10 w-10'
  },
  lg: {
    text: 'h-12 px-7 text-[15px] gap-2',
    icon: 'h-5 w-5',
    square: 'h-12 w-12'
  }
};
export function Button({
  variant = 'secondary',
  size = 'md',
  icon: Icon,
  children,
  className = '',
  type = 'button',
  ...rest
}: ButtonProps) {
  const s = SIZES[size];
  const hasLabel = children !== undefined && children !== null && children !== false;
  return <button type={type} className={`inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-full transition-[transform,background-color,border-color,color] duration-150 ease-snappy disabled:pointer-events-none disabled:opacity-40 ${VARIANTS[variant]} ${hasLabel ? s.text : s.square} ${className}`} {...rest}>
      {Icon && <Icon className={s.icon} aria-hidden="true" />}
      {children}
    </button>;
}