import { describe, expect, it } from 'vitest';
import {
  beginAttempt,
  cartTotal,
  finishAttempt,
  isStockShort,
  isValidPhone,
  pollIntervalMs,
  remainingSeconds,
  showLatePayment,
  type SaleAttempt,
} from './logic';

describe('sale logic', () => {
  it('adds line prices without sending them to the server', () => {
    expect(
      cartTotal([
        { price: 1250, qty: 2 },
        { price: 40, qty: 1 },
      ]),
    ).toBe(2540);
    expect(cartTotal([])).toBe(0);
  });

  it('accepts only the M-PESA phone formats', () => {
    expect(isValidPhone('0912345678')).toBe(true);
    expect(isValidPhone('0712345678')).toBe(true);
    expect(isValidPhone('+251912345678')).toBe(true);
    expect(isValidPhone('+251712345678')).toBe(true);
    expect(isValidPhone('251912345678')).toBe(true);
    expect(isValidPhone('2519123456789')).toBe(true);
    expect(isValidPhone(' 0912345678 ')).toBe(true);
    expect(isValidPhone('0812345678')).toBe(false);
    expect(isValidPhone('09123')).toBe(false);
    expect(isValidPhone('+251812345678')).toBe(false);
  });

  it('reuses the idempotency key after a network failure and mints a new one after a finished attempt', () => {
    const keys = ['key-a', 'key-b'];
    const generate = () => keys.shift() ?? 'extra';
    let attempt: SaleAttempt = { key: null, reuse: false };
    const first = beginAttempt(attempt, generate);
    attempt = first.attempt;
    expect(first.key).toBe('key-a');
    attempt = finishAttempt(attempt, 'network');
    const retry = beginAttempt(attempt, generate);
    expect(retry.key).toBe('key-a');
    attempt = finishAttempt(retry.attempt, 'done');
    const next = beginAttempt(attempt, generate);
    expect(next.key).toBe('key-b');
  });

  it('counts down from secondsLeft and ignores the device clock', () => {
    const startedAt = Date.parse('2024-01-15T12:00:00.000Z');
    expect(remainingSeconds(60, startedAt, startedAt + 5000)).toBe(55);
    expect(remainingSeconds(60, startedAt, startedAt + 70_000)).toBe(0);
  });

  it('polls only while the stream is down and the sale is still pending', () => {
    expect(pollIntervalMs(false, 'PENDING')).toBe(3000);
    expect(pollIntervalMs(true, 'PENDING')).toBe(false);
    expect(pollIntervalMs(false, 'PAID')).toBe(false);
    expect(pollIntervalMs(false, undefined)).toBe(false);
  });

  it('warns for tracked stock below the quantity and flags a late payment', () => {
    expect(isStockShort({ stockStatus: 'ok', stock: 1 }, 2)).toBe(true);
    expect(isStockShort({ stockStatus: 'untracked', stock: 0 }, 2)).toBe(false);
    expect(showLatePayment('PAID', true)).toBe(true);
    expect(showLatePayment('PAID', false)).toBe(false);
    expect(showLatePayment('TIMEOUT', true)).toBe(false);
  });
});
