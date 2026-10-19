import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { getDashboard, getStock, listTransactions } from '../../api/endpoints';
import { Sheet } from '../../components/ui/Sheet';
import { useOnline } from '../../hooks/useOnline';
import type { Locale } from '../../shared/types';
import { useLocaleStore } from '../../store/locale';
import { formatDelta, formatMoney } from '../../utils/format';
import { localizedName } from '../dashboard/logic';

interface Notice {
  id: string;
  title: string;
  body: string;
  when: string;
  tone: 'stock' | 'sales' | 'pay';
}

function ageLabel(iso: string, t: (key: string, options?: { count: number }) => string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) {
    return t('common:today');
  }
  const minutes = Math.max(0, Math.round((Date.now() - then) / 60000));
  if (minutes < 1) {
    return t('common:justNow');
  }
  if (minutes < 60) {
    return t('common:minutesAgo', { count: minutes });
  }
  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return t('common:hoursAgo', { count: hours });
  }
  return t('common:daysAgo', { count: Math.round(hours / 24) });
}

function NoticeIcon({ tone }: { tone: Notice['tone'] }) {
  const className =
    tone === 'stock'
      ? 'bg-warning-soft text-warning'
      : tone === 'sales'
        ? 'bg-primary-soft text-primary'
        : 'bg-success-soft text-success';
  return (
    <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-[12px] ${className}`}>
      {tone === 'stock' ? (
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        >
          <path d="M12 4 3 20h18L12 4Z" />
          <path d="M12 9v5M12 17h.01" />
        </svg>
      ) : null}
      {tone === 'sales' ? (
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
          <path d="m3 17 6-6 4 4 8-9" />
          <path d="M15 6h6v6" />
        </svg>
      ) : null}
      {tone === 'pay' ? (
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
      ) : null}
    </span>
  );
}

export function NoticeSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation(['common', 'dashboard']);
  const online = useOnline();
  const locale = useLocaleStore((state) => state.locale);
  const stock = useQuery({
    queryKey: ['stock'],
    queryFn: getStock,
    enabled: open && online,
    staleTime: 10_000,
  });
  const sales = useQuery({
    queryKey: ['transactions', 'notices'],
    queryFn: () => listTransactions({ limit: 5 }),
    enabled: open && online,
    staleTime: 10_000,
  });
  const today = useQuery({
    queryKey: ['dashboard', 'today'],
    queryFn: () => getDashboard('today'),
    enabled: open && online,
    staleTime: 10_000,
  });

  const notices: Notice[] = [];
  for (const item of stock.data ?? []) {
    if (item.status !== 'low' && item.status !== 'out') {
      continue;
    }
    const name = localizedName(item, locale);
    notices.push({
      id: `stock-${item.productId}`,
      title: t(item.status === 'out' ? 'common:soldOut' : 'common:almostOut', { name }),
      body: t('common:unitsLeft', { count: item.stock }),
      when: t('common:today'),
      tone: 'stock',
    });
  }
  const change = today.data?.comparisons?.yesterday?.deltaPct;
  if (typeof change === 'number' && change !== 0) {
    notices.push({
      id: 'sales-today',
      title: t('common:strongSales'),
      body: t(change > 0 ? 'common:revenueUp' : 'common:revenueDown', {
        pct: formatDelta(Math.abs(change)).replace(/^\+/, ''),
      }),
      when: t('common:today'),
      tone: 'sales',
    });
  }
  for (const sale of sales.data?.transactions ?? []) {
    notices.push({
      id: `pay-${sale.id}`,
      title: t('common:paymentReceived'),
      body: formatMoney(sale.amount, locale as Locale),
      when: ageLabel(sale.timestamp, t),
      tone: 'pay',
    });
  }

  const loading = stock.isPending || sales.isPending || today.isPending;

  return (
    <Sheet
      open={open}
      title={t('common:notifications')}
      subtitle={!loading && notices.length === 0 ? t('common:caughtUp') : undefined}
      onClose={onClose}
      preferField={false}
    >
      {online && loading && notices.length === 0 ? (
        <p role="status">{t('common:loading')}</p>
      ) : null}
      {!loading && notices.length === 0 ? (
        <div className="grid place-items-center gap-3 py-10 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-primary-soft text-primary">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-7 w-7"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m5 12 5 5L20 7" />
            </svg>
          </span>
          <p className="text-base font-semibold text-muted">{t('common:caughtUp')}</p>
        </div>
      ) : null}
      <ul className="grid gap-2">
        {notices.map((notice) => (
          <li
            key={notice.id}
            className="flex items-start gap-3 rounded-2xl border border-line bg-surface px-3 py-3"
          >
            <NoticeIcon tone={notice.tone} />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <p className="font-bold leading-snug">{notice.title}</p>
                <p className="shrink-0 text-xs text-muted">{notice.when}</p>
              </div>
              <p className="mt-1 text-sm text-muted">{notice.body}</p>
            </div>
          </li>
        ))}
      </ul>
    </Sheet>
  );
}
