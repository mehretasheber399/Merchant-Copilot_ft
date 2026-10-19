import { type FormEvent, type ReactNode, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { config } from '../config';
import i18n from '../i18n';
import { PinPad } from '../features/simulator/PinPad';
import type { SimFailure } from '../features/simulator/errors';
import { canConfirm } from '../features/simulator/pin';
import { useCustomerSim } from '../features/simulator/useCustomerSim';
import { useLocaleStore } from '../store/locale';
import type { SaleLine, SaleStatus } from '../shared/types';
import { formatMoney } from '../utils/format';
import { useQuery } from '@tanstack/react-query';
import { getMockPending } from '../api/endpoints';

function failureText(failure: SimFailure): string {
  if (failure.kind === 'network') {
    return i18n.t('errors:network');
  }
  if (failure.kind === 'rate') {
    return i18n.t('simulator:rate');
  }
  if (failure.kind === 'unavailable') {
    return i18n.t('simulator:unavailable');
  }
  if (failure.kind === 'unknown') {
    return i18n.t('simulator:unknown');
  }
  if (failure.kind === 'conflict') {
    return i18n.t('simulator:closed');
  }
  return i18n.t('errors:generic');
}

function statusText(status: SaleStatus): string {
  if (status === 'PAID') {
    return i18n.t('simulator:paid');
  }
  if (status === 'DECLINED') {
    return i18n.t('simulator:wrongPin');
  }
  if (status === 'INSUFFICIENT') {
    return i18n.t('simulator:insufficient');
  }
  if (status === 'TIMEOUT') {
    return i18n.t('simulator:expired');
  }
  if (status === 'CANCELLED') {
    return i18n.t('simulator:cancelled');
  }
  return i18n.t('simulator:unknown');
}

function PhoneShell({ header, children }: { header: ReactNode; children: ReactNode }) {
  const { t } = useTranslation('simulator');
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[420px] flex-col bg-primary">
      <header className="px-4 pb-5 pt-[max(1.25rem,env(safe-area-inset-top))] text-primary-foreground">
        <p className="text-sm font-semibold">{t('brand')}</p>
        <div className="mt-3">{header}</div>
      </header>
      <div className="flex flex-1 flex-col gap-4 rounded-t-card bg-surface px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-5 text-ink">
        {children}
      </div>
    </div>
  );
}

function ItemsList({
  items,
  amount,
  businessName,
  locale,
}: {
  items: SaleLine[];
  amount: number;
  businessName?: string;
  locale: Parameters<typeof formatMoney>[1];
}) {
  const { t } = useTranslation('simulator');
  if (items.length === 0) {
    return null;
  }
  return (
    <section aria-label={t('itemsTitle')} className="rounded-card border border-line p-3">
      <h2 className="text-base font-semibold">{t('itemsTitle')}</h2>
      {businessName ? <p className="mb-2 text-sm text-muted">{businessName}</p> : null}
      <ul className="grid gap-2">
        {items.map((item) => (
          <li key={item.productId} className="flex items-start justify-between gap-3 text-sm">
            <span className="min-w-0">
              <span className="block truncate font-semibold">{item.name}</span>
              <span className="text-xs text-muted">
                {item.qty} × {formatMoney(item.price, locale)}
              </span>
            </span>
            <span className="shrink-0 font-semibold tabular-nums">
              {formatMoney(item.price * item.qty, locale)}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 flex justify-between border-t border-line pt-2 text-base font-bold">
        <span>{t('receiptTotal')}</span>
        <span className="tabular-nums">{formatMoney(amount, locale)}</span>
      </p>
    </section>
  );
}

function Outcome({
  status,
  onRetry,
  items = [],
  amount = 0,
  businessName,
}: {
  status: SaleStatus;
  onRetry?: () => void;
  items?: SaleLine[];
  amount?: number;
  businessName?: string;
}) {
  const { t } = useTranslation('simulator');
  const locale = useLocaleStore((state) => state.locale);
  const heading = useRef<HTMLHeadingElement>(null);
  const label = statusText(status);

  useEffect(() => {
    heading.current?.focus();
  }, [status]);

  return (
    <PhoneShell
      header={
        <h1 ref={heading} tabIndex={-1} className="text-2xl font-semibold">
          {label}
        </h1>
      }
    >
      <p role="status" className="text-lg font-semibold">
        {label}
      </p>
      {status === 'PAID' ? (
        <ItemsList items={items} amount={amount} businessName={businessName} locale={locale} />
      ) : null}
      {onRetry ? <Button onClick={onRetry}>{t('retry')}</Button> : null}
    </PhoneShell>
  );
}

function RequestLookup({ onOpen }: { onOpen: (requestId: string) => void }) {
  const { t } = useTranslation('simulator');
  const [value, setValue] = useState('');
  const [invalid, setInvalid] = useState(false);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const requestId = value.trim();
    if (!requestId) {
      setInvalid(true);
      return;
    }
    onOpen(requestId);
  };

  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      <Input
        label={t('requestLabel')}
        value={value}
        autoComplete="off"
        onChange={(event) => {
          setValue(event.target.value);
          setInvalid(false);
        }}
        error={invalid ? t('requestMissing') : undefined}
      />
      <Button type="submit">{t('open')}</Button>
    </form>
  );
}

export function CustomerSimPage() {
  const { t } = useTranslation('simulator');
  const locale = useLocaleStore((state) => state.locale);
  const [params, setParams] = useSearchParams();
  const requestId = params.get('requestId')?.trim() || null;
  const screen = useCustomerSim(requestId);
  const info = useQuery({
    queryKey: ['mock-pending-items', requestId],
    queryFn: () => getMockPending(requestId as string),
    enabled: Boolean(requestId),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    retry: 1,
  });
  const items = info.data?.items ?? [];
  const openRequest = (id: string) => {
    setParams({ requestId: id }, { replace: true });
  };

  if (screen.phase === 'lookup') {
    return (
      <PhoneShell header={<h1 className="text-2xl font-semibold">{t('title')}</h1>}>
        <RequestLookup onOpen={openRequest} />
      </PhoneShell>
    );
  }

  if (screen.phase === 'offline') {
    return (
      <PhoneShell header={<h1 className="text-2xl font-semibold">{t('title')}</h1>}>
        <p role="status" className="font-semibold text-warning">
          {i18n.t('common:offline')}
        </p>
      </PhoneShell>
    );
  }

  if (screen.phase === 'loading') {
    return (
      <PhoneShell header={<h1 className="text-2xl font-semibold">{t('title')}</h1>}>
        <p role="status">{i18n.t('common:loading')}</p>
      </PhoneShell>
    );
  }

  if (screen.phase === 'loadError') {
    return (
      <PhoneShell header={<h1 className="text-2xl font-semibold">{t('title')}</h1>}>
        <p role="alert" className="font-semibold text-danger">
          {failureText(screen.failure)}
        </p>
        <Button onClick={screen.retry}>{i18n.t('errors:retry')}</Button>
      </PhoneShell>
    );
  }

  if (screen.phase === 'final') {
    return (
      <Outcome
        status={screen.status}
        onRetry={screen.retry}
        items={items}
        amount={info.data?.amount}
        businessName={info.data?.businessName}
      />
    );
  }

  return (
    <PhoneShell
      header={
        <div className="grid gap-2">
          <h1 className="text-xl font-semibold">
            {t('prompt', {
              business: screen.businessName,
              amount: formatMoney(screen.amount, locale),
            })}
          </h1>
          <p>{screen.phoneMasked}</p>
          {screen.expired ? (
            <p role="status" className="font-semibold">
              {t('expired')}
            </p>
          ) : (
            <p role="status">{t('secondsLeft', { count: screen.seconds })}</p>
          )}
        </div>
      }
    >
      {screen.failure ? (
        <p role="alert" className="font-semibold text-danger">
          {failureText(screen.failure)}
        </p>
      ) : null}
      <ItemsList
        items={items}
        amount={screen.amount}
        businessName={screen.businessName}
        locale={locale}
      />
      {config.demoTools ? <p className="text-sm text-muted">{t('hint')}</p> : null}
      <PinPad
        value={screen.pin}
        disabled={screen.submitting}
        onChange={screen.onChange}
        onBackspace={screen.onBackspace}
        onConfirm={screen.onConfirm}
      />
      <Button
        disabled={!canConfirm(screen.pin) || screen.expired}
        loading={screen.submitting}
        onClick={screen.onConfirm}
      >
        {t('confirm')}
      </Button>
    </PhoneShell>
  );
}
