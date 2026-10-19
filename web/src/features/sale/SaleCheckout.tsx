import { useTranslation } from 'react-i18next';
import { ProductMark } from '../../components/ProductMark';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Sheet } from '../../components/ui/Sheet';
import type { Locale, ProductView } from '../../shared/types';
import type { CartLine } from '../../store/cart';
import { useLocaleStore } from '../../store/locale';
import { formatMoney } from '../../utils/format';

function productName(product: ProductView, locale: Locale): string {
  if (locale === 'am' && product.nameAm.trim()) {
    return product.nameAm;
  }
  return product.name;
}

function Arrow() {
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
      <path d="M5 12h14M14 7l5 5-5 5" />
    </svg>
  );
}

export function SaleCheckout({
  step,
  products,
  lines,
  total,
  phone,
  phoneError,
  limitReached,
  failure,
  requesting,
  onClose,
  onBack,
  onContinue,
  onChange,
  onPhone,
  onPhoneBlur,
  onSubmit,
}: {
  step: 'cart' | 'pay' | null;
  products: ProductView[];
  lines: CartLine[];
  total: number;
  phone: string;
  phoneError?: string;
  limitReached?: string;
  failure?: string;
  requesting: boolean;
  onClose: () => void;
  onBack: () => void;
  onContinue: () => void;
  onChange: (productId: string, delta: number) => void;
  onPhone: (value: string) => void;
  onPhoneBlur: () => void;
  onSubmit: () => void;
}) {
  const { t } = useTranslation('sale');
  const locale = useLocaleStore((state) => state.locale);
  const count = lines.reduce((sum, line) => sum + line.qty, 0);

  return (
    <>
      <Sheet
        open={step === 'cart'}
        title={t('currentSale')}
        subtitle={t('itemsSelected', { count })}
        onClose={onClose}
        preferField={false}
      >
        <ul className="grid">
          {lines.map((line) => {
            const product = products.find((item) => item.id === line.productId);
            const name = product ? productName(product, locale) : line.productId;
            return (
              <li
                key={line.productId}
                className="flex items-center gap-3 border-b border-line py-3"
              >
                <ProductMark name={name} large />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{name}</p>
                  <p className="text-sm text-muted tabular-nums">
                    {formatMoney(line.price, locale)}
                  </p>
                </div>
                <div className="grid h-12 shrink-0 grid-cols-[48px_2rem_48px] items-center rounded-full bg-primary-soft text-primary">
                  <button
                    type="button"
                    className="grid h-12 place-items-center text-xl font-bold"
                    aria-label={t('decrease', { name })}
                    onClick={() => onChange(line.productId, -1)}
                  >
                    −
                  </button>
                  <span className="text-center text-sm font-bold tabular-nums">{line.qty}</span>
                  <button
                    type="button"
                    className="grid h-12 place-items-center text-xl font-bold disabled:opacity-60"
                    aria-label={t('increase', { name })}
                    disabled={line.qty >= 99}
                    onClick={() => onChange(line.productId, 1)}
                  >
                    +
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
        {limitReached ? (
          <p className="mt-3 text-sm font-semibold text-warning">{limitReached}</p>
        ) : null}
        <div className="mt-4 flex min-h-12 items-center justify-between">
          <span className="text-sm font-semibold text-muted">{t('total')}</span>
          <span className="text-xl font-bold tabular-nums">{formatMoney(total, locale)}</span>
        </div>
        <div className="mt-4">
          <Button onClick={onContinue}>
            {t('continuePayment')}
            <Arrow />
          </Button>
        </div>
      </Sheet>
      <Sheet
        open={step === 'pay'}
        title={t('request')}
        subtitle={t('paymentHint')}
        onBack={onBack}
        onClose={onClose}
      >
        <div className="rounded-2xl bg-[#0F3D28] px-4 py-6 text-center text-primary-foreground">
          <p className="text-sm text-[#C5E3D4]">{t('amountDue')}</p>
          <p className="mt-1 text-3xl font-bold tabular-nums">{formatMoney(total, locale)}</p>
          <p className="mt-1 text-sm text-[#C5E3D4]">{t('itemCount', { count })}</p>
        </div>
        <div className="mt-4">
          <Input
            label={t('phone')}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder={t('phonePlaceholder')}
            value={phone}
            onChange={(event) => onPhone(event.target.value)}
            onBlur={onPhoneBlur}
            error={phoneError}
          />
        </div>
        <div className="mt-4 flex min-h-14 items-center gap-3 rounded-2xl border border-primary/15 bg-primary-soft px-4">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-surface text-primary">
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
              <rect x="3" y="6" width="18" height="12" rx="2" />
              <path d="M3 10h18" />
            </svg>
          </span>
          <span className="flex-1 text-sm font-bold">{t('mpesa')}</span>
          <span
            aria-hidden="true"
            className="grid h-7 w-7 place-items-center rounded-full bg-primary text-primary-foreground"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
            >
              <path d="m5 12 5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>
        {failure ? (
          <p role="alert" className="mt-3 text-sm font-semibold text-danger">
            {failure}
          </p>
        ) : null}
        <div className="mt-4">
          <Button loading={requesting} onClick={onSubmit} aria-label={t('request')}>
            {t('requestAmount', { amount: formatMoney(total, locale) })}
            <Arrow />
          </Button>
        </div>
      </Sheet>
    </>
  );
}
