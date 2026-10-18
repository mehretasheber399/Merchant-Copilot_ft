import type { Locale } from '../shared/types';

const ADDIS = 'Africa/Addis_Ababa';

export function formatMoney(amount: number, locale: Locale): string {
  const formatted = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(amount);
  return locale === 'am' ? `${formatted} ብር` : `${formatted} ETB`;
}

export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '-';
  }
  return `${value.toFixed(1)}%`;
}

export function formatDelta(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '-';
  }
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

export function formatTime(iso: string, locale: Locale): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }
  return new Intl.DateTimeFormat(locale === 'am' ? 'am-ET' : 'en-GB', {
    timeZone: ADDIS,
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date);
}
