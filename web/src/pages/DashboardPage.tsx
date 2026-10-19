import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { HoursChart } from '../features/dashboard/HoursChart';
import { KpiTiles } from '../features/dashboard/KpiTiles';
import { RangeSwitcher } from '../features/dashboard/RangeSwitcher';
import { StockPanel } from '../features/dashboard/StockPanel';
import { TopProducts } from '../features/dashboard/TopProducts';
import { TransactionFeed } from '../features/dashboard/TransactionFeed';
import { buildKpis } from '../features/dashboard/logic';
import { useDashboardScreen } from '../features/dashboard/useDashboardScreen';
import i18n from '../i18n';
import { useAuthStore } from '../store/auth';
import { useLocaleStore } from '../store/locale';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase();
  }
  return (name.trim().slice(0, 2) || 'S').toUpperCase();
}

function LoadingBlock() {
  return (
    <div aria-busy="true">
      <p className="sr-only" role="status">
        {i18n.t('common:loading')}
      </p>
      <div className="h-24 animate-pulse rounded-card bg-canvas" />
    </div>
  );
}

function SectionError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="grid gap-3">
      <p role="alert">{i18n.t('errors:network')}</p>
      <Button onClick={onRetry}>{i18n.t('errors:retry')}</Button>
    </div>
  );
}

export function DashboardPage() {
  const { t } = useTranslation(['dashboard', 'sale', 'common']);
  const locale = useLocaleStore((state) => state.locale);
  const businessName = useAuthStore((state) => state.merchant?.businessName ?? '');
  const screen = useDashboardScreen();
  const model = buildKpis(screen.dashboard.data?.range ?? screen.range, screen.dashboard.data);
  const busy = screen.dashboard.isFetching;
  const dateLabel = new Intl.DateTimeFormat(locale === 'am' ? 'am-ET' : 'en-GB', {
    timeZone: 'Africa/Addis_Ababa',
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  }).format(new Date());

  return (
    <section className="grid gap-4" aria-busy={busy || undefined}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-primary">
            {dateLabel}
          </p>
          <h1 className="truncate text-[22px] font-bold tracking-tight">
            {businessName || t('dashboard:title')}
          </h1>
        </div>
        <span
          aria-hidden="true"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#F1D6BA] text-xs font-bold text-[#744728]"
        >
          {initials(businessName)}
        </span>
      </div>
      <RangeSwitcher range={screen.range} onChange={screen.setRange} />
      {!screen.online && !screen.dashboard.data ? (
        <p role="status" className="font-semibold text-warning">
          {i18n.t('common:offline')}
        </p>
      ) : null}
      {screen.online && screen.dashboard.isPending && !screen.dashboard.data ? (
        <LoadingBlock />
      ) : null}
      {screen.online && screen.dashboard.isError && !screen.dashboard.data ? (
        <SectionError onRetry={() => void screen.dashboard.refetch()} />
      ) : null}
      {model ? <KpiTiles model={model} locale={locale} /> : null}
      <div className="grid grid-cols-2 gap-3">
        <Link
          to="/sale"
          className="flex min-h-[72px] items-center gap-2 rounded-[15px] border border-[#D5E8DC] bg-surface px-3"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[11px] bg-primary-soft text-primary">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold">{t('sale:newSale')}</span>
            <span className="block truncate text-xs text-muted">{t('sale:request')}</span>
          </span>
        </Link>
        <Link
          to="/reports"
          className="flex min-h-[72px] items-center gap-2 rounded-[15px] border border-line bg-surface px-3"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[11px] bg-primary-soft text-primary">
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
              <path d="M6 3h9l4 4v14H6z" />
              <path d="M14 3v5h5" />
            </svg>
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold">{t('common:reports')}</span>
            <span className="block truncate text-xs text-muted">{t('dashboard:range')}</span>
          </span>
        </Link>
      </div>
      {screen.online && screen.hours.isPending && !screen.hours.data ? <LoadingBlock /> : null}
      {screen.online && screen.hours.isError && !screen.hours.data ? (
        <SectionError onRetry={() => void screen.hours.refetch()} />
      ) : null}
      {screen.hours.data ? (
        <HoursChart buckets={screen.hours.data.buckets} peaks={screen.hours.data.peakHours} />
      ) : null}
      {screen.online && screen.products.isPending && !screen.products.data ? (
        <LoadingBlock />
      ) : null}
      {screen.online && screen.products.isError && !screen.products.data ? (
        <SectionError onRetry={() => void screen.products.refetch()} />
      ) : null}
      {screen.products.data ? (
        <TopProducts products={screen.products.data} locale={locale} />
      ) : null}
      {screen.online && screen.stock.isPending && !screen.stock.data ? <LoadingBlock /> : null}
      {screen.online && screen.stock.isError && !screen.stock.data ? (
        <SectionError onRetry={() => void screen.stock.refetch()} />
      ) : null}
      {screen.stock.data ? <StockPanel items={screen.stock.data} locale={locale} /> : null}
      {screen.online && screen.feed.isPending && screen.rows.length === 0 ? <LoadingBlock /> : null}
      {screen.online && screen.feed.isError ? (
        <SectionError onRetry={() => void screen.feed.refetch()} />
      ) : null}
      {screen.feed.isSuccess || screen.rows.length > 0 ? (
        <TransactionFeed
          rows={screen.rows}
          locale={locale}
          flashIds={screen.flashIds}
          hasMore={Boolean(screen.feed.hasNextPage)}
          loadingMore={screen.feed.isFetchingNextPage}
          onMore={() => void screen.feed.fetchNextPage()}
        />
      ) : null}
    </section>
  );
}
