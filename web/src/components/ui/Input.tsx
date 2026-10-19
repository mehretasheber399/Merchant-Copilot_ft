import { useId, useState, type InputHTMLAttributes } from 'react';
import { useTranslation } from 'react-i18next';

type InputProps = {
  label: string;
  error?: string;
  hint?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'id'>;

export function Input({ label, error, hint, type, ...props }: InputProps) {
  const { t } = useTranslation('common');
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = [hint ? hintId : '', error ? errorId : ''].filter(Boolean).join(' ');
  const secret = type === 'password';
  const [shown, setShown] = useState(false);
  return (
    <label htmlFor={id} className="grid gap-1 text-sm font-semibold">
      {label}
      <span className="relative block">
        <input
          id={id}
          type={secret && shown ? 'text' : type}
          className={`min-h-12 w-full rounded-xl border bg-surface px-3 text-base font-medium outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(8,122,73,0.12)] ${error ? 'border-danger' : 'border-line'} ${secret ? 'pr-12' : ''}`}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          {...props}
        />
        {secret ? (
          <button
            type="button"
            className="absolute inset-y-0 right-0 grid w-12 place-items-center text-muted"
            aria-label={shown ? t('hidePassword') : t('showPassword')}
            onClick={() => setShown((value) => !value)}
          >
            {shown ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        ) : null}
      </span>
      {hint ? (
        <span id={hintId} className="text-sm font-normal text-muted">
          {hint}
        </span>
      ) : null}
      {error ? (
        <span id={errorId} role="alert" className="text-sm font-medium text-danger">
          {error}
        </span>
      ) : null}
    </label>
  );
}

function EyeIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6A3 3 0 0 0 12 15a3 3 0 0 0 2.4-4.4" />
      <path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c6.5 0 10 7 10 7a18.4 18.4 0 0 1-3.2 4.4" />
      <path d="M6.1 6.1C3.7 7.8 2 12 2 12s3.5 7 10 7c1.5 0 2.9-.3 4.1-.9" />
    </svg>
  );
}
