import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { pushDigit, vibrateKey } from './pin';

const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'] as const;

type PinPadProps = {
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
  onBackspace: () => void;
  onConfirm: () => void;
};

export function PinPad({ value, disabled, onChange, onBackspace, onConfirm }: PinPadProps) {
  const { t } = useTranslation('simulator');
  const field = useRef<HTMLInputElement>(null);

  useEffect(() => {
    field.current?.focus();
  }, []);

  const press = (digit: string) => {
    if (disabled) {
      return;
    }
    onChange(pushDigit(value, digit));
    vibrateKey();
    field.current?.focus();
  };

  const erase = () => {
    if (disabled) {
      return;
    }
    onBackspace();
    vibrateKey();
    field.current?.focus();
  };

  return (
    <div className="grid gap-4">
      <input
        ref={field}
        aria-label={t('pin')}
        inputMode="numeric"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        maxLength={4}
        value={value}
        disabled={disabled}
        className="sr-only"
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            onConfirm();
          }
        }}
      />
      <p className="sr-only" role="status" aria-live="polite">
        {t('entered', { count: value.length })}
      </p>
      <div className="flex justify-center gap-4" aria-hidden="true">
        {Array.from({ length: 4 }, (_, index) => (
          <span
            key={index}
            className={`h-4 w-4 rounded-full border-2 border-ink ${index < value.length ? 'bg-ink' : 'bg-surface'}`}
          />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {DIGITS.map((digit) => (
          <button
            key={digit}
            type="button"
            className="min-h-16 rounded-control bg-canvas text-2xl font-semibold"
            disabled={disabled}
            onClick={() => press(digit)}
          >
            {digit}
          </button>
        ))}
        <span />
        <button
          type="button"
          className="min-h-16 rounded-control bg-canvas text-2xl font-semibold"
          disabled={disabled}
          onClick={() => press('0')}
        >
          0
        </button>
        <button
          type="button"
          className="min-h-16 rounded-control bg-canvas text-base font-semibold"
          aria-label={t('backspace')}
          disabled={disabled}
          onClick={erase}
        >
          ⌫
        </button>
      </div>
    </div>
  );
}
