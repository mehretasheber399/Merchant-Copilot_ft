import { ApiError } from '../../api/client';
import type {
  Bilingual,
  InsightView,
  Locale,
  SuggestionCandidate,
  SuggestionLine,
} from '../../shared/types';

export type MappingErrorKey = 'mismatch' | 'conflict' | 'missing' | 'network' | 'generic';

export interface PickedLine {
  productId: string;
  qty: number;
}

export function textOf(value: Pick<Bilingual, 'en' | 'am'> | undefined, locale: Locale): string {
  if (!value) {
    return '';
  }
  const preferred = value[locale]?.trim();
  if (preferred) {
    return preferred;
  }
  return value.en?.trim() || value.am?.trim() || '';
}

export function sortInsights(insights: InsightView[] | undefined): InsightView[] {
  return [...(insights ?? [])].sort(
    (left, right) =>
      (left.priority ?? Number.MAX_SAFE_INTEGER) - (right.priority ?? Number.MAX_SAFE_INTEGER),
  );
}

export function canSeeEvidence(insight: InsightView | undefined): boolean {
  return typeof insight?.id === 'string' && insight.id.length > 0;
}

export function formatCalcValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return '-';
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      return '-';
    }
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(value);
  }
  return value;
}

export function mappingErrorKey(error: unknown): MappingErrorKey {
  if (!(error instanceof ApiError)) {
    return 'network';
  }
  if (error.status === 400 || error.code === 'VALIDATION_ERROR') {
    return 'mismatch';
  }
  if (error.status === 409 || error.code === 'CONFLICT') {
    return 'conflict';
  }
  if (error.status === 404 || error.code === 'NOT_FOUND') {
    return 'missing';
  }
  if (error.code === 'NETWORK_ERROR' || error.code === 'TIMEOUT' || error.status === 0) {
    return 'network';
  }
  return 'generic';
}

export function suggestionLines(suggestion: SuggestionCandidate | null | undefined): PickedLine[] {
  return (suggestion?.items ?? [])
    .filter((item): item is SuggestionLine => Boolean(item?.productId))
    .map((item) => ({ productId: item.productId, qty: clampQty(item.qty) }));
}

export function clampQty(qty: number): number {
  if (!Number.isInteger(qty) || qty < 1) {
    return 1;
  }
  return Math.min(99, qty);
}

export function runningTotal(lines: PickedLine[], priceOf: (productId: string) => number): number {
  return lines.reduce((sum, line) => sum + priceOf(line.productId) * line.qty, 0);
}

export function canConfirmMapping(total: number, payment: number, lineCount: number): boolean {
  return lineCount > 0 && total === payment;
}

export function addPickedLine(lines: PickedLine[], productId: string): PickedLine[] {
  if (!productId) {
    return lines;
  }
  const existing = lines.find((line) => line.productId === productId);
  if (!existing) {
    return [...lines, { productId, qty: 1 }];
  }
  return lines.map((line) =>
    line.productId === productId ? { ...line, qty: clampQty(line.qty + 1) } : line,
  );
}

export function changePickedQty(lines: PickedLine[], productId: string, qty: number): PickedLine[] {
  return lines.map((line) =>
    line.productId === productId ? { ...line, qty: clampQty(qty) } : line,
  );
}

export function removePickedLine(lines: PickedLine[], productId: string): PickedLine[] {
  return lines.filter((line) => line.productId !== productId);
}
