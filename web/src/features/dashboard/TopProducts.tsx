import { useTranslation } from 'react-i18next';
import type { Locale, TopProduct } from '../../shared/types';
import { formatMoney } from '../../utils/format';
import { localizedName } from './logic';

export function TopProducts({ products, locale }: { products: TopProduct[]; locale: Locale }) {
  const { t } = useTranslation('dashboard');
  return (
    <section
      aria-label={t('topProducts')}
      className="rounded-card border border-line bg-surface p-4"
    >
      <h2 className="text-base font-bold">{t('topProducts')}</h2>
      {products.length === 0 ? <p className="mt-2 text-muted">{t('emptyProducts')}</p> : null}
      <ul className="mt-1">
        {products.map((product) => {
          const name = localizedName(product, locale);
          return (
            <li
              key={product.productId}
              className="flex min-h-12 items-center gap-3 border-b border-line py-3 last:border-b-0"
            >
              <span
                aria-hidden="true"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary-soft text-sm font-extrabold text-primary"
              >
                {name.slice(0, 1)}
              </span>
              <span className="min-w-0 flex-1 font-semibold">{name}</span>
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
  );
}
