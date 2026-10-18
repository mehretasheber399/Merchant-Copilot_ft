import { useId, type InputHTMLAttributes } from 'react';

type InputProps = {
  label: string;
  error?: string;
  hint?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'id'>;

export function Input({ label, error, hint, ...props }: InputProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = [hint ? hintId : '', error ? errorId : ''].filter(Boolean).join(' ');
  return (
    <label htmlFor={id} className="grid gap-1 text-sm font-semibold">
      {label}
      <input
        id={id}
        className="min-h-control w-full rounded-control border border-line bg-surface px-3 text-base font-normal"
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        {...props}
      />
      {hint ? (
        <span id={hintId} className="text-sm font-normal text-muted">
          {hint}
        </span>
      ) : null}
      {error ? (
        <span id={errorId} className="text-sm font-medium text-danger">
          {error}
        </span>
      ) : null}
    </label>
  );
}
