import { useTranslation } from 'react-i18next';
import { ProductMark } from '../../components/ProductMark';
import type { Locale, TopProduct } from '../../shared/types';
import { formatMoney } from '../../utils/format';
import { localizedName } from './logic';

export function TopProducts({ products, locale }: { products: TopProduct[]; locale: Locale }) {
  const { t } = useTranslation('dashboard');
  return (
    <section aria-label={t('topProducts')} className="grid gap-3">
      <h2 className="text-sm font-bold">{t('topProducts')}</h2>
      {products.length === 0 ? <p className="text-muted">{t('emptyProducts')}</p> : null}
      {products.length > 0 ? (
        <ul className="overflow-hidden rounded-card border border-line bg-surface">
          {products.map((product) => {
            const name = localizedName(product, locale);
            return (
              <li
                key={product.productId}
                className="flex min-h-12 items-center gap-3 border-b border-line px-3 py-3 last:border-b-0"
              >
                <ProductMark name={name} />
                <span className="min-w-0 flex-1 text-sm font-semibold">{name}</span>
                <span className="shrink-0 text-right text-sm">
                  <span className="block font-bold tabular-nums text-primary">
                    {formatMoney(product.revenue, locale)}
                  </span>
                  <span className="text-xs text-muted">{t('qty', { count: product.qty })}</span>
                </span>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
