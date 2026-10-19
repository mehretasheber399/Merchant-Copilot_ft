import { useTranslation } from 'react-i18next';
import { ProductMark } from '../../components/ProductMark';
import type { Locale, ReportSummary } from '../../shared/types';
import { formatMoney, formatPercent } from '../../utils/format';

const SOURCES = ['cart', 'manual', 'autoSuggested', 'unmapped'] as const;

const STATUS_KEY = {
  out: 'stockOut',
  low: 'stockLow',
  ok: 'stockOk',
} as const;

export function ReportPreview({ report, locale }: { report: ReportSummary; locale: Locale }) {
  const { t } = useTranslation('reports');
  const summary = report.summary;
  const total =
    typeof summary?.totalCollections === 'number'
      ? formatMoney(summary.totalCollections, locale)
      : '-';
  const count =
    typeof summary?.transactionCount === 'number' ? String(summary.transactionCount) : '-';
  const average =
    typeof summary?.averageSale === 'number' ? formatMoney(summary.averageSale, locale) : '-';
  const products = report.topProducts ?? [];
  const low = report.lowStock ?? [];
  const mix = report.mappingMix;

  return (
    <div className="grid gap-4">
      <p className="text-sm font-semibold text-muted">{report.merchant?.businessName}</p>
      <section
        aria-label={t('collections')}
        className="rounded-[17px] bg-primary p-5 text-primary-foreground shadow-shell"
      >
        <h2 className="text-xs text-[#B9DDC9]">{t('collections')}</h2>
        <p className="mt-2 text-[26px] font-bold tabular-nums leading-none">{total}</p>
      </section>
      <div className="grid grid-cols-2 gap-3">
        <section
          aria-label={t('transactions')}
          className="rounded-[14px] border border-line bg-surface p-4"
        >
          <h2 className="text-xs font-semibold text-muted">{t('transactions')}</h2>
          <p className="mt-1 text-xl font-extrabold tabular-nums leading-none">{count}</p>
        </section>
        <section
          aria-label={t('average')}
          className="rounded-[14px] border border-line bg-surface p-4"
        >
          <h2 className="text-xs font-semibold text-muted">{t('average')}</h2>
          <p className="mt-1 text-xl font-extrabold tabular-nums leading-none">{average}</p>
        </section>
      </div>
      <section
        aria-label={t('topProducts')}
        className="overflow-hidden rounded-card border border-line bg-surface"
      >
        <h2 className="px-4 pt-4 text-sm font-bold">{t('topProducts')}</h2>
        {products.length === 0 ? (
          <p className="px-4 pb-4 pt-2 text-muted">{t('emptyProducts')}</p>
        ) : null}
        <ul className="mt-1">
          {products.map((product) => {
            const name = locale === 'am' && product.nameAm?.trim() ? product.nameAm : product.name;
            return (
              <li
                key={product.productId}
                className="flex min-h-12 items-center gap-3 border-b border-line px-4 py-3 last:border-b-0"
              >
                <ProductMark name={name} />
                <span className="min-w-0 flex-1 break-words font-semibold">{name}</span>
                <span className="shrink-0 text-right text-sm">
                  <span className="block font-extrabold tabular-nums text-primary">
                    {formatMoney(product.revenue, locale)}
                  </span>
                  <span className="text-muted">{t('qty', { count: product.qty })}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </section>
      <section
        aria-label={t('lowStock')}
        className="rounded-card border border-line bg-surface p-4"
      >
        <h2 className="text-base font-bold">{t('lowStock')}</h2>
        {low.length === 0 ? <p className="mt-2 text-muted">{t('emptyLow')}</p> : null}
        <ul className="mt-1">
          {low.map((item) => {
            const name = locale === 'am' && item.nameAm?.trim() ? item.nameAm : item.name;
            return (
              <li
                key={item.productId}
                className="flex min-h-12 items-center justify-between gap-3 border-b border-line py-3 last:border-b-0"
              >
                <span className="min-w-0 break-words font-semibold">{name}</span>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${
                    item.status === 'out'
                      ? 'bg-danger-soft text-danger'
                      : item.status === 'ok'
                        ? 'bg-success-soft text-success'
                        : 'bg-warning-soft text-warning'
                  }`}
                >
                  {t(STATUS_KEY[item.status] ?? 'stockLow')}
                </span>
              </li>
            );
          })}
        </ul>
      </section>
      <section aria-label={t('mix')} className="rounded-card border border-line bg-surface p-4">
        <h2 className="text-base font-bold">{t('mix')}</h2>
        <ul className="mt-1">
          {SOURCES.map((source) => {
            const point = mix?.[source];
            const amount =
              typeof point?.amount === 'number' ? formatMoney(point.amount, locale) : '-';
            return (
              <li
                key={source}
                className="flex min-h-12 items-center justify-between gap-3 border-b border-line py-3 last:border-b-0"
              >
                <span className="font-semibold">{t(source)}</span>
                <span className="text-sm font-bold tabular-nums text-primary">
                  {amount} · {formatPercent(point?.pct)}
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
