import { describe, expect, it } from 'vitest';
import { formatClock, formatDelta, formatMoney, formatPercent, formatTime } from './format';

describe('formatters', () => {
  it('formats money in English and Amharic', () => {
    expect(formatMoney(1250, 'en')).toBe('1,250 ETB');
    expect(formatMoney(1250, 'am')).toBe('1,250 ብር');
  });

  it('formats percentages to one decimal and null deltas as a dash', () => {
    expect(formatPercent(12.34)).toBe('12.3%');
    expect(formatPercent(null)).toBe('-');
    expect(formatDelta(null)).toBe('-');
    expect(formatDelta(2)).toBe('+2.0%');
    expect(formatDelta(-1.26)).toBe('-1.3%');
  });

  it('formats times in Africa/Addis_Ababa', () => {
    expect(formatTime('2024-01-15T12:00:00.000Z', 'en')).toContain('15:00');
    expect(formatTime('not-a-date', 'en')).toBe('-');
  });

  it('formats receipt clock times', () => {
    expect(formatClock('2024-01-15T07:42:00.000Z', 'en')).toMatch(/10:42/);
    expect(formatClock('not-a-date', 'en')).toBe('-');
  });
});
