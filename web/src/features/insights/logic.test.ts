import { describe, expect, it } from 'vitest';
import { ApiError } from '../../api/client';
import type { InsightView } from '../../shared/types';
import {
  addPickedLine,
  canConfirmMapping,
  canSeeEvidence,
  changePickedQty,
  formatCalcValue,
  mappingErrorKey,
  runningTotal,
  sortInsights,
  suggestionLines,
  textOf,
} from './logic';

function insight(partial: Partial<InsightView>): InsightView {
  return {
    type: 'lowStockRisk',
    priority: 1,
    what: { en: 'Oil', am: 'ዘይት' },
    why: { en: 'why', am: 'ምክንያት' },
    check: { en: 'check', am: 'መርምር' },
    nextAction: { en: 'next', am: 'ቀጣይ' },
    confidence: 'high',
    evidenceTransactionIds: [],
    calc: [],
    dateKey: '2026-10-18',
    ...partial,
  };
}

describe('insight logic', () => {
  it('follows the active language and sorts by priority', () => {
    expect(textOf({ en: 'Oil', am: 'ዘይት' }, 'am')).toBe('ዘይት');
    expect(textOf({ en: 'Oil', am: '  ' }, 'am')).toBe('Oil');
    expect(textOf(undefined, 'en')).toBe('');
    const ordered = sortInsights([
      insight({ priority: 3, id: 'c' }),
      insight({ priority: 1, id: 'a' }),
    ]);
    expect(ordered.map((item) => item.id)).toEqual(['a', 'c']);
  });

  it('hides evidence without an id and formats calc values', () => {
    expect(canSeeEvidence(insight({}))).toBe(false);
    expect(canSeeEvidence(insight({ id: '' }))).toBe(false);
    expect(canSeeEvidence(insight({ id: 'i1' }))).toBe(true);
    expect(formatCalcValue(null)).toBe('-');
    expect(formatCalcValue(1250)).toBe('1,250');
    expect(formatCalcValue('n/a')).toBe('n/a');
  });

  it('classifies mapping errors and matches a payment total', () => {
    expect(
      mappingErrorKey(new ApiError({ code: 'VALIDATION_ERROR', message: 'no', status: 400 })),
    ).toBe('mismatch');
    expect(mappingErrorKey(new ApiError({ code: 'CONFLICT', message: 'no', status: 409 }))).toBe(
      'conflict',
    );
    expect(mappingErrorKey(new ApiError({ code: 'NOT_FOUND', message: 'no', status: 404 }))).toBe(
      'missing',
    );
    expect(mappingErrorKey(new Error('offline'))).toBe('network');
    const lines = suggestionLines({
      items: [{ productId: 'p1', name: 'Sugar', qty: 2 }],
      total: 160,
      exact: true,
      score: 1,
    });
    expect(runningTotal(lines, () => 80)).toBe(160);
    expect(canConfirmMapping(160, 160, lines.length)).toBe(true);
    expect(canConfirmMapping(80, 160, 1)).toBe(false);
    expect(changePickedQty(addPickedLine([], 'p1'), 'p1', 100)[0]?.qty).toBe(99);
  });
});
