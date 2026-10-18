import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { SantimClip } from '../../components/SantimClip';
import type { Locale } from '../../shared/types';
import { formatDelta, formatMoney } from '../../utils/format';
import {
  coverageTone,
  deltaDirection,
  formatCoverage,
  type DeltaView,
  type KpiModel,
} from './logic';

function DeltaLine({ delta, onDark = false }: { delta: DeltaView; onDark?: boolean }) {
  const { t } = useTranslation('dashboard');
  const direction = deltaDirection(delta.deltaPct);
  const color = onDark
    ? 'text-primary-foreground'
    : direction === 'up'
      ? 'text-success'
      : direction === 'down'
        ? 'text-danger'
        : 'text-muted';
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
    <section aria-label={label} className="rounded-card border border-line bg-surface p-4">
      <h2 className="text-sm font-semibold text-muted">{label}</h2>
      <p className="mt-1 text-[26px] font-extrabold tabular-nums leading-none">{value}</p>
      <div className="mt-2 grid gap-1">
        {deltas.map((delta) => (
          <DeltaLine key={delta.id} delta={delta} />
        ))}
      </div>
    </section>
  );
}

export function KpiTiles({ model, locale }: { model: KpiModel; locale: Locale }) {
  const { t } = useTranslation(['dashboard', 'common']);
  const tone = coverageTone(model.coveragePct);
  const pill =
    tone === 'warning'
      ? 'bg-warning-soft text-warning'
      : tone === 'success'
        ? 'bg-success-soft text-success'
        : 'bg-canvas text-muted';
  return (
    <div className="grid gap-3">
      <section
        aria-label={t('dashboard:collections')}
        className="relative overflow-hidden rounded-card bg-primary p-5 text-primary-foreground shadow-shell"
      >
        <SantimClip className="absolute inset-0 h-full w-full object-cover object-[50%_35%]" />
        <div className="absolute inset-0 bg-gradient-to-br from-[rgba(2,50,30,0.88)] via-[rgba(0,107,60,0.82)] to-[rgba(0,70,40,0.78)]" />
        <div className="relative">
          <h2 className="text-sm font-semibold opacity-80">{t('dashboard:collections')}</h2>
          <p className="mt-1 text-4xl font-extrabold tabular-nums leading-none">
            {formatMoney(model.total, locale)}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {model.collectionDeltas.map((delta) => (
              <div key={delta.id} className="rounded-full bg-white/20 px-3 py-1">
                <DeltaLine delta={delta} onDark />
              </div>
            ))}
          </div>
        </div>
      </section>
      <div className="grid grid-cols-2 gap-3">
        <Tile
          label={t('dashboard:transactions')}
          value={String(model.count)}
          deltas={[model.countDelta]}
        />
        <Tile
          label={t('dashboard:average')}
          value={formatMoney(model.average, locale)}
          deltas={[model.averageDelta]}
        />
      </div>
      <p className={`rounded-full px-3 py-2 text-sm font-semibold ${pill}`}>
        {model.coveragePct === null
          ? '-'
          : t('dashboard:coverage', { pct: formatCoverage(model.coveragePct) })}
      </p>
      <Link
        to="/reports"
        className="inline-flex min-h-12 items-center text-sm font-bold text-primary"
      >
        {t('common:reports')}
      </Link>
    </div>
  );
}
