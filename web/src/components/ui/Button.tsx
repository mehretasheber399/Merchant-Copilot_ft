import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Spinner } from './Spinner';

type ButtonProps = {
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  children: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>;

const variants = {
  primary: 'bg-primary text-primary-foreground shadow-shell active:scale-[0.98]',
  secondary: 'border border-line bg-surface text-ink shadow-card active:scale-[0.98]',
  danger: 'bg-danger text-primary-foreground shadow-card active:scale-[0.98]',
};

export function Button({
  loading = false,
  variant = 'primary',
  children,
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      {...props}
      className={`inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-[18px] px-4 text-base font-bold transition-transform disabled:scale-100 disabled:opacity-60 disabled:shadow-none ${variants[variant]}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
    >
      {loading ? <Spinner /> : null}
      {children}
    </button>
  );
}
