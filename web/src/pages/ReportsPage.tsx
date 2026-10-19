import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/Button';
import { RangeSwitcher } from '../features/dashboard/RangeSwitcher';
import { ReportPreview } from '../features/reports/ReportPreview';
import { useReportsScreen } from '../features/reports/useReportsScreen';
import { useProductList } from '../hooks/useProducts';
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

function DownloadIcon() {
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
      <path d="M12 4v10" />
      <path d="m8 10 4 4 4-4" />
      <path d="M5 19h14" />
    </svg>
  );
}

export function ReportsPage() {
  const { t } = useTranslation('reports');
  const locale = useLocaleStore((state) => state.locale);
  const screen = useReportsScreen();
  const catalog = useProductList('');

  return (
    <section className="grid gap-4" aria-busy={screen.report.isFetching || undefined}>
      <h1 className="sr-only">{t('title')}</h1>
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <RangeSwitcher range={screen.range} onChange={screen.setRange} />
        </div>
        <button
          type="button"
          className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-line bg-surface text-ink disabled:opacity-60"
          aria-label={t('download')}
          aria-busy={screen.downloading === 'pdf' || undefined}
          disabled={screen.downloading !== null}
          onClick={() => screen.download('pdf')}
        >
          <DownloadIcon />
        </button>
      </div>
      {!screen.online && !screen.report.data ? (
        <p role="status" className="font-semibold text-warning">
          {i18n.t('common:offline')}
        </p>
      ) : null}
      {screen.online && screen.report.isPending && !screen.report.data ? <LoadingBlock /> : null}
      {screen.online && screen.report.isError && !screen.report.data ? (
        <div className="grid gap-3">
          <p role="alert">{i18n.t('errors:network')}</p>
          <Button onClick={screen.retry}>{i18n.t('errors:retry')}</Button>
        </div>
      ) : null}
      {screen.report.data ? (
        <ReportPreview report={screen.report.data} locale={locale} catalog={catalog.data ?? []} />
      ) : null}
      {screen.downloadError ? (
        <p role="alert" className="font-semibold text-danger">
          {screen.errorText}
        </p>
      ) : null}
    </section>
  );
}
