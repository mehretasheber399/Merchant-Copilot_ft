import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/Button';
import { RangeSwitcher } from '../features/dashboard/RangeSwitcher';
import { ReportPreview } from '../features/reports/ReportPreview';
import { useReportsScreen } from '../features/reports/useReportsScreen';
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

export function ReportsPage() {
  const { t } = useTranslation('reports');
  const locale = useLocaleStore((state) => state.locale);
  const screen = useReportsScreen();

  return (
    <section className="grid gap-4" aria-busy={screen.report.isFetching || undefined}>
      <h1 className="sr-only">{t('title')}</h1>
      <RangeSwitcher range={screen.range} onChange={screen.setRange} />
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
      {screen.report.data ? <ReportPreview report={screen.report.data} locale={locale} /> : null}
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="secondary"
          loading={screen.downloading === 'csv'}
          disabled={screen.downloading !== null}
          onClick={() => screen.download('csv')}
        >
          {t('csv')}
        </Button>
        <Button
          variant="secondary"
          loading={screen.downloading === 'pdf'}
          disabled={screen.downloading !== null}
          onClick={() => screen.download('pdf')}
        >
          {t('pdf')}
        </Button>
        {screen.downloadError ? (
          <p role="alert" className="col-span-2 font-semibold text-danger">
            {screen.errorText}
          </p>
        ) : null}
      </div>
    </section>
  );
}
