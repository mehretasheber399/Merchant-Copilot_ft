import { describe, expect, it } from 'vitest';
import type { DashboardView, HourBucket, TransactionPage } from '../../shared/types';
import { buildKpis, chartBuckets, coverageTone, deltaDirection, mergeTransactions } from './logic';

function view(partial: Partial<DashboardView>): DashboardView {
  return {
    range: 'today',
    from: '2026-10-18T00:00:00.000Z',
    to: '2026-10-18T10:00:00.000Z',
    totalCollections: 5000,
    transactionCount: 4,
    averageSale: 1250,
    comparisons: {},
    dataCoverage: { mappedAmount: 4600, totalAmount: 5000, pct: 92 },
    ...partial,
  };
}

describe('dashboard figures', () => {
  it('renders an up delta, a down delta, and a dash for null', () => {
    expect(deltaDirection(12.5)).toBe('up');
    expect(deltaDirection(-3)).toBe('down');
    expect(deltaDirection(0)).toBe('flat');
    expect(deltaDirection(null)).toBe('none');
    const kpis = buildKpis(
      'today',
      view({
        comparisons: {
          yesterday: { total: 4000, count: 2, deltaAbs: 1000, deltaPct: 12.5 },
          sameWeekdayLastWeek: { total: 3000, count: 3, deltaAbs: 2000, deltaPct: -4 },
          sevenDayAverage: { total: 3500, count: 3, deltaAbs: 0, deltaPct: null },
        },
      }),
    );
    expect(kpis?.collectionDeltas.map((delta) => delta.deltaPct)).toEqual([12.5, -4, null]);
    expect(kpis?.countDelta.deltaPct).toBe(100);
    expect(kpis?.averageDelta.deltaPct).toBeCloseTo(-37.5);
  });

  it('uses previousPeriod for week and month', () => {
    const comparisons = {
      previousPeriod: { total: 8000, count: 8, deltaAbs: -3000, deltaPct: -20 },
    };
    const week = buildKpis('week', view({ range: 'week', comparisons }));
    const month = buildKpis('month', view({ range: 'month', comparisons }));
    expect(week?.collectionDeltas).toEqual([
      { id: 'previous', labelKey: 'vsPrevious', deltaPct: -20 },
    ]);
    expect(month?.countDelta.labelKey).toBe('vsPrevious');
    expect(month?.collectionDeltas).toHaveLength(1);
  });

  it('keeps a missing comparison as a null delta', () => {
    const kpis = buildKpis('week', view({ range: 'week', comparisons: {} }));
    expect(kpis?.collectionDeltas[0]?.deltaPct).toBeNull();
    expect(kpis?.countDelta.deltaPct).toBeNull();
    expect(coverageTone(70)).toBe('warning');
    expect(coverageTone(92)).toBe('success');
    expect(coverageTone(null)).toBe('muted');
  });

  it('always gives the chart 24 hourly buckets', () => {
    const sparse: HourBucket[] = [{ hour: 9, label: '09:00', total: 800, count: 2 }];
    const buckets = chartBuckets(sparse);
    expect(buckets).toHaveLength(24);
    expect(buckets[9]).toEqual(sparse[0]);
    expect(buckets[0]?.total).toBe(0);
    expect(chartBuckets(undefined)).toHaveLength(24);
  });

  it('pages the feed without duplicating a sale', () => {
    const first: TransactionPage = {
      transactions: [
        {
          id: 'a',
          amount: 100,
          timestamp: '2026-10-18T08:00:00.000Z',
          mappingSource: 'cart',
          confidence: 'exact',
          items: [],
        },
        {
          id: 'b',
          amount: 200,
          timestamp: '2026-10-18T09:00:00.000Z',
          mappingSource: 'unmapped',
          confidence: 'estimate',
          items: [],
        },
      ],
      nextCursor: 'c1',
    };
    const second: TransactionPage = {
      transactions: [
        {
          id: 'b',
          amount: 200,
          timestamp: '2026-10-18T09:00:00.000Z',
          mappingSource: 'unmapped',
          confidence: 'estimate',
          items: [],
        },
        {
          id: 'c',
          amount: 300,
          timestamp: '2026-10-18T10:00:00.000Z',
          mappingSource: 'auto-suggested',
          confidence: 'estimate',
          items: [],
        },
      ],
      nextCursor: null,
    };
    expect(mergeTransactions([first, second]).map((row) => row.id)).toEqual(['a', 'b', 'c']);
  });
});
