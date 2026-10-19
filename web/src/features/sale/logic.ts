import type {
  ProductView,
  SaleRequestView,
  SaleStatus,
  SaleUpdatedEvent,
} from '../../shared/types';

const FINAL: ReadonlySet<SaleStatus> = new Set([
  'PAID',
  'DECLINED',
  'TIMEOUT',
  'CANCELLED',
  'INSUFFICIENT',
]);

const PHONE = /^(?:0[79]\d{8}|\+251[79]\d{8}|251[79]\d{8})$/;

export function isValidPhone(value: string): boolean {
  return PHONE.test(value.trim().replace(/[\s-]/g, ''));
}

export function cartTotal(lines: { price: number; qty: number }[]): number {
  return lines.reduce((sum, line) => sum + line.price * line.qty, 0);
}

export function nextQty(qty: number, delta: number): number {
  return Math.min(99, Math.max(0, qty + delta));
}

export function isStockShort(
  product: Pick<ProductView, 'stock' | 'stockStatus'>,
  qty: number,
): boolean {
  if (qty <= 0 || product.stockStatus === 'untracked' || product.stock === undefined) {
    return false;
  }
  return product.stock < qty;
}

export function isFinalStatus(status: SaleStatus): boolean {
  return FINAL.has(status);
}

export function pollIntervalMs(connected: boolean, status: SaleStatus | undefined): number | false {
  if (!status || isFinalStatus(status) || connected) {
    return false;
  }
  return 3000;
}

export function remainingSeconds(secondsLeft: number, startedAt: number, now: number): number {
  const elapsed = Math.floor((now - startedAt) / 1000);
  return Math.max(0, secondsLeft - elapsed);
}

export function showLatePayment(
  status: SaleStatus,
  lateConfirmation: boolean | undefined,
): boolean {
  return status === 'PAID' && lateConfirmation === true;
}

export function applySaleUpdate(sale: SaleRequestView, event: SaleUpdatedEvent): SaleRequestView {
  return {
    ...sale,
    status: event.status,
    amount: event.amount,
    lateConfirmation: event.lateConfirmation ?? sale.lateConfirmation,
  };
}

export interface SaleAttempt {
  key: string | null;
  reuse: boolean;
}

export function beginAttempt(
  attempt: SaleAttempt,
  generate: () => string,
): { key: string; attempt: SaleAttempt } {
  if (attempt.reuse && attempt.key) {
    return { key: attempt.key, attempt: { ...attempt, reuse: false } };
  }
  const key = generate();
  return { key, attempt: { key, reuse: false } };
}

export function filterProducts(products: ProductView[], search: string): ProductView[] {
  const needle = search.trim().toLowerCase();
  if (!needle) {
    return products;
  }
  return products.filter(
    (product) =>
      product.name.toLowerCase().includes(needle) || product.nameAm.toLowerCase().includes(needle),
  );
}

export function finishAttempt(attempt: SaleAttempt, outcome: 'network' | 'done'): SaleAttempt {
  if (outcome === 'network') {
    return { key: attempt.key, reuse: true };
  }
  return { key: null, reuse: false };
}
