import { useTranslation } from 'react-i18next';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { HourBucket } from '../../shared/types';
import { useLocaleStore } from '../../store/locale';
import { formatMoney } from '../../utils/format';
import { chartBuckets, isPeakHour } from './logic';

function HourTip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: HourBucket }>;
}) {
  const { t } = useTranslation('dashboard');
  const locale = useLocaleStore((state) => state.locale);
  const bucket = payload?.[0]?.payload;
  if (!active || !bucket) {
    return null;
  }
  return (
    <div className="rounded-control bg-ink px-2 py-1 text-sm text-primary-foreground">
      <p>{bucket.label}</p>
      <p>{formatMoney(bucket.total, locale)}</p>
      <p>{t('salesCount', { count: bucket.count })}</p>
    </div>
  );
}

export function HoursChart({
  buckets,
  peaks,
}: {
  buckets: HourBucket[] | undefined;
  peaks: HourBucket[] | undefined;
}) {
  const { t } = useTranslation('dashboard');
  const points = chartBuckets(buckets);
  const peakCount = points.filter((bucket) => isPeakHour(bucket.hour, peaks)).length;
  return (
    <section
      aria-label={t('hours')}
      className="min-w-0 rounded-card border border-line bg-surface p-4"
    >
      <h2 className="text-sm font-bold">{t('hours')}</h2>
      <p className="mt-1 text-xs text-muted">{t('peakNote')}</p>
      <div
        className="mt-3 h-[200px] min-w-0"
        data-testid="hour-chart"
        data-count={points.length}
        data-peaks={peakCount}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={points} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
            <XAxis
              dataKey="label"
              interval={3}
              tick={{ fontSize: 11, fill: '#4E5C54' }}
              tickLine={false}
              axisLine={false}
              height={32}
            />
            <YAxis
              width={36}
              tick={{ fontSize: 11, fill: '#4E5C54' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<HourTip />} />
            <Bar dataKey="total" radius={[4, 4, 0, 0]} isAnimationActive={false}>
              {points.map((bucket) => (
                <Cell
                  key={bucket.hour}
                  fill={isPeakHour(bucket.hour, peaks) ? '#198050' : '#B8D7C6'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
