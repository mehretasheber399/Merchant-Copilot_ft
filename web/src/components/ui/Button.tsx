import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Spinner } from './Spinner';

type ButtonProps = {
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  children: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>;

const variants = {
  primary: 'bg-primary text-primary-foreground',
  secondary: 'border border-line bg-surface text-ink',
  danger: 'bg-danger text-primary-foreground',
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
      className={`inline-flex min-h-control w-full items-center justify-center gap-2 rounded-control px-4 text-base font-semibold disabled:opacity-60 ${variants[variant]}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
    >
      {loading ? <Spinner /> : null}
      {children}
    </button>
  );
}
