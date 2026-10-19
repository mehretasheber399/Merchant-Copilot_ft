import type {
  ComparisonPoint,
  DashboardRange,
  DashboardView,
  HourBucket,
  MappingSource,
  SaleUpdatedEvent,
  StockLowEvent,
  TransactionPage,
  TransactionRow,
} from '../../shared/types';

export type DeltaDirection = 'up' | 'down' | 'flat' | 'none';

export type DeltaLabel = 'vsYesterday' | 'vsSameWeekday' | 'vsSevenDay' | 'vsPrevious';

export interface DeltaView {
  id: string;
  labelKey: DeltaLabel;
  deltaPct: number | null;
}

export interface KpiModel {
  total: number;
  count: number;
  average: number;
  collectionDeltas: DeltaView[];
  countDelta: DeltaView;
  averageDelta: DeltaView;
  coveragePct: number | null;
}

export type CoverageTone = 'warning' | 'success' | 'muted';

export type MappingKind = 'matched' | 'estimate' | 'review';

export function deltaDirection(value: number | null | undefined): DeltaDirection {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return 'none';
  }
  if (value > 0) {
    return 'up';
  }
  if (value < 0) {
    return 'down';
  }
  return 'flat';
}

function percentChange(current: number | undefined, baseline: number | undefined): number | null {
  if (typeof current !== 'number' || typeof baseline !== 'number' || baseline === 0) {
    return null;
  }
  return ((current - baseline) / baseline) * 100;
}

function averageChange(
  current: number | undefined,
  point: ComparisonPoint | undefined,
): number | null {
  if (
    typeof current !== 'number' ||
    !point ||
    typeof point.count !== 'number' ||
    point.count === 0
  ) {
    return null;
  }
  if (typeof point.total !== 'number') {
    return null;
  }
  const baseline = point.total / point.count;
  if (baseline === 0) {
    return null;
  }
  return ((current - baseline) / baseline) * 100;
}

function deltaOf(point: ComparisonPoint | undefined): number | null {
  if (!point || typeof point.deltaPct !== 'number') {
    return point?.deltaPct ?? null;
  }
  return point.deltaPct;
}

export function buildKpis(range: DashboardRange, view: DashboardView | undefined): KpiModel | null {
  if (!view) {
    return null;
  }
  const comparisons = view.comparisons ?? {};
  const today = range === 'today';
  const primary = today ? comparisons.yesterday : comparisons.previousPeriod;
  const primaryLabel: DeltaLabel = today ? 'vsYesterday' : 'vsPrevious';
  const coverage = view.dataCoverage;
  return {
    total: typeof view.totalCollections === 'number' ? view.totalCollections : 0,
    count: typeof view.transactionCount === 'number' ? view.transactionCount : 0,
    average: typeof view.averageSale === 'number' ? view.averageSale : 0,
    collectionDeltas: today
      ? [
          { id: 'yesterday', labelKey: 'vsYesterday', deltaPct: deltaOf(comparisons.yesterday) },
          {
            id: 'weekday',
            labelKey: 'vsSameWeekday',
            deltaPct: deltaOf(comparisons.sameWeekdayLastWeek),
          },
          {
            id: 'sevenDay',
            labelKey: 'vsSevenDay',
            deltaPct: deltaOf(comparisons.sevenDayAverage),
          },
        ]
      : [{ id: 'previous', labelKey: 'vsPrevious', deltaPct: deltaOf(comparisons.previousPeriod) }],
    countDelta: {
      id: 'count',
      labelKey: primaryLabel,
      deltaPct: percentChange(view.transactionCount, primary?.count),
    },
    averageDelta: {
      id: 'average',
      labelKey: primaryLabel,
      deltaPct: averageChange(view.averageSale, primary),
    },
    coveragePct: typeof coverage?.pct === 'number' ? coverage.pct : null,
  };
}

export function coverageTone(pct: number | null): CoverageTone {
  if (pct === null || Number.isNaN(pct)) {
    return 'muted';
  }
  return pct < 80 ? 'warning' : 'success';
}

export function formatCoverage(pct: number): string {
  return Number.isInteger(pct) ? `${pct}%` : `${pct.toFixed(1)}%`;
}

export function chartBuckets(buckets: HourBucket[] | undefined): HourBucket[] {
  const byHour = new Map((buckets ?? []).map((bucket) => [bucket.hour, bucket]));
  return Array.from({ length: 24 }, (_, hour) => {
    const found = byHour.get(hour);
    if (found) {
      return found;
    }
    return {
      hour,
      label: `${String(hour).padStart(2, '0')}:00`,
      total: 0,
      count: 0,
    };
  });
}

export function isPeakHour(hour: number, peaks: HourBucket[] | undefined): boolean {
  return (peaks ?? []).some((peak) => peak.hour === hour);
}

export function mergeTransactions(pages: TransactionPage[]): TransactionRow[] {
  const seen = new Set<string>();
  const rows: TransactionRow[] = [];
  for (const page of pages) {
    for (const row of page.transactions ?? []) {
      if (!row?.id || seen.has(row.id)) {
        continue;
      }
      seen.add(row.id);
      rows.push(row);
    }
  }
  return rows;
}

export function mappingKind(source: MappingSource | undefined): MappingKind {
  if (source === 'cart' || source === 'manual') {
    return 'matched';
  }
  if (source === 'auto-suggested') {
    return 'estimate';
  }
  return 'review';
}

export function sellingProfit(
  sold: { productId: string; qty: number; revenue: number }[],
  costs: { id: string; cost?: number }[],
): { amount: number; partial: boolean } | null {
  if (sold.length === 0 || costs.length === 0) {
    return null;
  }
  const costOf = new Map(costs.map((product) => [product.id, product.cost]));
  let amount = 0;
  let known = 0;
  for (const row of sold) {
    const cost = costOf.get(row.productId);
    if (typeof cost !== 'number') {
      continue;
    }
    known += 1;
    amount += row.revenue - cost * row.qty;
  }
  if (known === 0) {
    return null;
  }
  return { amount, partial: known < sold.length };
}

export function localizedName(
  item: { name?: string; nameAm?: string },
  locale: 'en' | 'am',
): string {
  if (locale === 'am' && item.nameAm?.trim()) {
    return item.nameAm;
  }
  return item.name ?? '';
}

export function isPaidSale(data: unknown): data is SaleUpdatedEvent {
  if (!data || typeof data !== 'object') {
    return false;
  }
  const event = data as SaleUpdatedEvent;
  return event.status === 'PAID' && typeof event.amount === 'number';
}

export function isStockLow(data: unknown): data is StockLowEvent {
  if (!data || typeof data !== 'object') {
    return false;
  }
  const event = data as StockLowEvent;
  return typeof event.name === 'string' && event.name.length > 0;
}
