import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Spinner } from './Spinner';

type ButtonProps = {
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  children: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>;

const variants = {
  primary:
    'bg-primary text-primary-foreground shadow-[0_7px_16px_rgba(8,122,73,0.18)] active:scale-[0.98]',
  secondary: 'border border-line bg-surface text-ink active:scale-[0.98]',
  danger: 'bg-danger text-primary-foreground active:scale-[0.98]',
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
      className={`inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-4 text-base font-bold transition-transform disabled:scale-100 disabled:opacity-60 disabled:shadow-none ${variants[variant]}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
    >
      {loading ? <Spinner /> : null}
      {children}
    </button>
  );
}
