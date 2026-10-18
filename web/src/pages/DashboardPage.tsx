import { useTranslation } from 'react-i18next';
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
import { useLocaleStore } from '../store/locale';

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
  const { t } = useTranslation('dashboard');
  const locale = useLocaleStore((state) => state.locale);
  const screen = useDashboardScreen();
  const model = buildKpis(screen.dashboard.data?.range ?? screen.range, screen.dashboard.data);
  const busy = screen.dashboard.isFetching;

  return (
    <section className="grid gap-4" aria-busy={busy || undefined}>
      <h1 className="text-2xl font-extrabold tracking-tight">{t('title')}</h1>
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
