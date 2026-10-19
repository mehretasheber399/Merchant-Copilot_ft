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
      {direction === 'up' ? <span aria-hidden="true">↑ </span> : null}
      {direction === 'down' ? <span aria-hidden="true">↓ </span> : null}
      {direction === 'up' ? <span className="sr-only">{t('up')} </span> : null}
      {direction === 'down' ? <span className="sr-only">{t('down')} </span> : null}
      {formatDelta(delta.deltaPct)} {t(delta.labelKey)}
    </p>
  );
}

function Tile({ label, value, deltas }: { label: string; value: string; deltas: DeltaView[] }) {
  return (
    <section aria-label={label} className="rounded-card border border-line bg-surface p-4">
      <h2 className="text-xs font-semibold text-muted">{label}</h2>
      <p className="mt-1 text-xl font-extrabold tabular-nums leading-none">{value}</p>
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
        : 'bg-[#EDF4F0] text-muted';
  return (
    <div className="grid gap-3">
      <section
        aria-label={t('collections')}
        className="relative overflow-hidden rounded-[19px] bg-gradient-to-br from-primary to-[#075F3B] p-5 text-primary-foreground shadow-shell"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full border-[28px] border-white/5"
        />
        <div className="relative">
          <div className="flex items-center justify-between">
            <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-white/15">
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
                <path d="m3 17 6-6 4 4 8-9" />
                <path d="M15 6h6v6" />
              </svg>
            </span>
          </div>
          <h2 className="mt-4 text-xs text-[#BDE1CD]">{t('collections')}</h2>
          <p className="mt-1 text-[28px] font-bold tabular-nums leading-none tracking-tight">
            {formatMoney(model.total, locale)}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {model.collectionDeltas.map((delta) => (
              <div key={delta.id} className="rounded-lg bg-white/15 px-2 py-1">
                <DeltaLine delta={delta} onDark />
              </div>
            ))}
          </div>
        </div>
      </section>
      <div className="grid grid-cols-2 gap-3">
        <Tile label={t('transactions')} value={String(model.count)} deltas={[model.countDelta]} />
        <Tile
          label={t('average')}
          value={formatMoney(model.average, locale)}
          deltas={[model.averageDelta]}
        />
      </div>
      <p className={`rounded-xl px-3 py-2 text-sm font-semibold ${pill}`}>
        {model.coveragePct === null
          ? '-'
          : t('coverage', { pct: formatCoverage(model.coveragePct) })}
      </p>
    </div>
  );
}
