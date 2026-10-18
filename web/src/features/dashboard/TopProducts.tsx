import { useTranslation } from 'react-i18next';
import type { Locale, TopProduct } from '../../shared/types';
import { formatMoney } from '../../utils/format';
import { localizedName } from './logic';

export function TopProducts({ products, locale }: { products: TopProduct[]; locale: Locale }) {
  const { t } = useTranslation('dashboard');
  return (
    <section aria-label={t('topProducts')}>
      <h2 className="text-lg font-semibold">{t('topProducts')}</h2>
      {products.length === 0 ? <p className="mt-2">{t('emptyProducts')}</p> : null}
      <ul className="mt-2 grid gap-2">
        {products.map((product) => (
          <li
            key={product.productId}
            className="flex min-h-control items-center justify-between gap-3 rounded-card border border-line px-3"
          >
            <span className="min-w-0 font-semibold">{localizedName(product, locale)}</span>
            <span className="shrink-0 text-right text-sm">
              <span className="block font-semibold">{formatMoney(product.revenue, locale)}</span>
              <span className="text-muted">{t('qty', { count: product.qty })}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
