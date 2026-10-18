import { useTranslation } from 'react-i18next';
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
      <p className="text-sm text-muted">{report.merchant?.businessName}</p>
      <div className="grid gap-3">
        <section aria-label={t('collections')} className="rounded-card border border-line p-3">
          <h2 className="text-sm font-semibold text-muted">{t('collections')}</h2>
          <p className="text-2xl font-semibold">{total}</p>
        </section>
        <section aria-label={t('transactions')} className="rounded-card border border-line p-3">
          <h2 className="text-sm font-semibold text-muted">{t('transactions')}</h2>
          <p className="text-2xl font-semibold">{count}</p>
        </section>
        <section aria-label={t('average')} className="rounded-card border border-line p-3">
          <h2 className="text-sm font-semibold text-muted">{t('average')}</h2>
          <p className="text-2xl font-semibold">{average}</p>
        </section>
      </div>
      <section aria-label={t('topProducts')}>
        <h2 className="text-lg font-semibold">{t('topProducts')}</h2>
        {products.length === 0 ? <p className="mt-2">{t('emptyProducts')}</p> : null}
        <ul className="mt-2 grid gap-2">
          {products.map((product) => (
            <li
              key={product.productId}
              className="flex min-h-control items-center justify-between gap-3 rounded-card border border-line px-3"
            >
              <span className="min-w-0 break-words font-semibold">
                {locale === 'am' && product.nameAm?.trim() ? product.nameAm : product.name}
              </span>
              <span className="shrink-0 text-right text-sm">
                <span className="block font-semibold">{formatMoney(product.revenue, locale)}</span>
                <span className="text-muted">{t('qty', { count: product.qty })}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>
      <section aria-label={t('lowStock')}>
        <h2 className="text-lg font-semibold">{t('lowStock')}</h2>
        {low.length === 0 ? <p className="mt-2">{t('emptyLow')}</p> : null}
        <ul className="mt-2 grid gap-2">
          {low.map((item) => (
            <li
              key={item.productId}
              className="flex min-h-control items-center justify-between gap-3 rounded-card border border-line px-3 py-2"
            >
              <span className="min-w-0 break-words font-semibold">
                {locale === 'am' && item.nameAm?.trim() ? item.nameAm : item.name}
              </span>
              <span className="shrink-0 text-sm font-semibold">
                {t(STATUS_KEY[item.status] ?? 'stockLow')}
              </span>
            </li>
          ))}
        </ul>
      </section>
      <section aria-label={t('mix')}>
        <h2 className="text-lg font-semibold">{t('mix')}</h2>
        <ul className="mt-2 grid gap-2">
          {SOURCES.map((source) => {
            const point = mix?.[source];
            const amount =
              typeof point?.amount === 'number' ? formatMoney(point.amount, locale) : '-';
            return (
              <li
                key={source}
                className="flex min-h-control items-center justify-between gap-3 rounded-card border border-line px-3"
              >
                <span className="font-semibold">{t(source)}</span>
                <span className="text-sm">
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
