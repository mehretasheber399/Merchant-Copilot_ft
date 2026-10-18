import { useTranslation } from 'react-i18next';
import type { Locale } from '../../shared/types';
import { formatDelta, formatMoney } from '../../utils/format';
import {
  coverageTone,
  deltaDirection,
  formatCoverage,
  type DeltaView,
  type KpiModel,
} from './logic';

function DeltaLine({ delta }: { delta: DeltaView }) {
  const { t } = useTranslation('dashboard');
  const direction = deltaDirection(delta.deltaPct);
  const color =
    direction === 'up' ? 'text-success' : direction === 'down' ? 'text-danger' : 'text-muted';
  return (
    <p className={`text-sm font-semibold ${color}`}>
      {direction === 'up' ? <span aria-hidden="true">▲ </span> : null}
      {direction === 'down' ? <span aria-hidden="true">▼ </span> : null}
      {direction === 'up' ? <span className="sr-only">{t('up')} </span> : null}
      {direction === 'down' ? <span className="sr-only">{t('down')} </span> : null}
      {formatDelta(delta.deltaPct)} {t(delta.labelKey)}
    </p>
  );
}

function Tile({ label, value, deltas }: { label: string; value: string; deltas: DeltaView[] }) {
  return (
    <section aria-label={label} className="rounded-card border border-line bg-surface p-3">
      <h2 className="text-sm font-semibold text-muted">{label}</h2>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      <div className="mt-2 grid gap-1">
        {deltas.map((delta) => (
          <DeltaLine key={delta.id} delta={delta} />
        ))}
      </div>
    </section>
  );
}

export function KpiTiles({ model, locale }: { model: KpiModel; locale: Locale }) {
  const { t } = useTranslation('dashboard');
  const tone = coverageTone(model.coveragePct);
  const pill =
    tone === 'warning'
      ? 'bg-warning-soft text-warning'
      : tone === 'success'
        ? 'bg-success-soft text-success'
        : 'bg-canvas text-muted';
  return (
    <div className="grid gap-3">
      <Tile
        label={t('collections')}
        value={formatMoney(model.total, locale)}
        deltas={model.collectionDeltas}
      />
      <Tile label={t('transactions')} value={String(model.count)} deltas={[model.countDelta]} />
      <Tile
        label={t('average')}
        value={formatMoney(model.average, locale)}
        deltas={[model.averageDelta]}
      />
      <p className={`rounded-control px-3 py-2 text-sm font-semibold ${pill}`}>
        {model.coveragePct === null
          ? '-'
          : t('coverage', { pct: formatCoverage(model.coveragePct) })}
      </p>
    </div>
  );
}
