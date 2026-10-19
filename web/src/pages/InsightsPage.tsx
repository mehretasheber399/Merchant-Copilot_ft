import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/Button';
import { BriefingCard } from '../features/insights/BriefingCard';
import { EvidenceDrawer } from '../features/insights/EvidenceDrawer';
import { InsightCards } from '../features/insights/InsightCards';
import { sortInsights } from '../features/insights/logic';
import { ReviewList } from '../features/insights/ReviewList';
import { useInsightsScreen } from '../features/insights/useInsightsScreen';
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

export function InsightsPage() {
  const { t } = useTranslation('insights');
  const locale = useLocaleStore((state) => state.locale);
  const screen = useInsightsScreen();
  const payload = screen.insights.data;
  const cards = sortInsights(payload?.insights);

  return (
    <section className="grid gap-4" aria-busy={screen.insights.isFetching || undefined}>
      <h1 className="sr-only">{t('title')}</h1>
      <Button
        variant="secondary"
        loading={screen.refresh.isPending}
        onClick={() => screen.refresh.mutate()}
      >
        {t('refresh')}
      </Button>
      {screen.refresh.isError ? (
        <p role="alert" className="font-semibold text-danger">
          {i18n.t('errors:network')}
        </p>
      ) : null}
      {!screen.online && !payload ? (
        <p role="status" className="font-semibold text-warning">
          {i18n.t('common:offline')}
        </p>
      ) : null}
      {screen.online && screen.insights.isPending && !payload ? <LoadingBlock /> : null}
      {screen.online && screen.insights.isError && !payload ? (
        <div className="grid gap-3">
          <p role="alert">{i18n.t('errors:network')}</p>
          <Button onClick={() => void screen.insights.refetch()}>{i18n.t('errors:retry')}</Button>
        </div>
      ) : null}
      {payload ? (
        <>
          <BriefingCard briefing={payload.briefing} locale={locale} />
          <InsightCards
            insights={cards}
            locale={locale}
            onEvidence={(id) => screen.setEvidenceId(id)}
          />
        </>
      ) : null}
      <ReviewList
        locale={locale}
        online={screen.online}
        review={screen.unmapped}
        products={screen.products}
        editingId={screen.editingId}
        onEdit={screen.setEditingId}
        confirm={screen.confirm}
        confirmError={screen.confirmErrorKey}
        dismiss={screen.dismiss}
        dismissErrorKey={screen.dismissErrorKey}
      />
      <EvidenceDrawer
        open={Boolean(screen.evidenceId)}
        locale={locale}
        evidence={screen.evidence}
        onClose={() => screen.setEvidenceId(null)}
      />
    </section>
  );
}
