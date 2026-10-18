import { describe, expect, it } from 'vitest';
import { canConfirm, popDigit, pushDigit, sanitizePin } from './pin';

describe('pin pad', () => {
  it('accepts digits, deletes the last one, and stops at 4', () => {
    let pin = '';
    for (const digit of '123') {
      pin = pushDigit(pin, digit);
    }
    expect(pin).toBe('123');
    expect(canConfirm(pin)).toBe(false);
    pin = popDigit(pin);
    expect(pin).toBe('12');
    pin = sanitizePin('12ab345');
    expect(pin).toBe('1234');
    expect(pushDigit(pin, '5')).toBe('1234');
    expect(canConfirm(pin)).toBe(true);
    expect(pushDigit('12', 'a')).toBe('12');
  });
});
