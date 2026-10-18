import type { InsightType } from '../../shared/types';

const paths: Record<InsightType, string> = {
  lowStockRisk: 'M4 18h16M6 18V8h4v10M14 18V4h4v14',
  unusualDropOrSpike: 'M4 16l5-6 4 3 7-8',
  revenueVsBaseline: 'M4 18V6M4 18h16M8 14v4M12 8v10M16 11v7',
  fastestMover: 'M5 15l5-5 3 3 6-7M14 6h5v5',
  slowMover: 'M6 8h12v8H6zM8 12h8',
  peakPeriod: 'M5 18V10M10 18V6M15 18v-5M20 18V8',
};

export function InsightIcon({
  type,
  className = 'h-10 w-10 shrink-0 text-primary',
}: {
  type: InsightType | undefined;
  className?: string;
}) {
  const d = type ? paths[type] : paths.revenueVsBaseline;
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={d} />
    </svg>
  );
}
