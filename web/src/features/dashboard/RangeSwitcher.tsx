import { useTranslation } from 'react-i18next';
import type { DashboardRange } from '../../shared/types';

const RANGES: DashboardRange[] = ['today', 'week', 'month'];

export function RangeSwitcher({
  range,
  onChange,
}: {
  range: DashboardRange;
  onChange: (range: DashboardRange) => void;
}) {
  const { t } = useTranslation('dashboard');
  return (
    <div
      role="radiogroup"
      aria-label={t('range')}
      className="grid grid-cols-3 gap-1 rounded-full border border-line bg-surface p-1"
    >
      {RANGES.map((option) => {
        const selected = option === range;
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={selected}
            className={`min-h-12 rounded-full px-2 text-sm font-semibold ${selected ? 'bg-primary text-primary-foreground' : 'text-muted'}`}
            onClick={() => onChange(option)}
          >
            {t(option)}
          </button>
        );
      })}
    </div>
  );
}
