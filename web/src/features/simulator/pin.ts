const PIN_LENGTH = 4;

export function sanitizePin(value: string): string {
  return value.replace(/\D/g, '').slice(0, PIN_LENGTH);
}

export function pushDigit(pin: string, digit: string): string {
  if (!/^\d$/.test(digit)) {
    return pin;
  }
  return sanitizePin(`${pin}${digit}`);
}

export function popDigit(pin: string): string {
  return pin.slice(0, -1);
}

export function canConfirm(pin: string): boolean {
  return /^\d{4}$/.test(pin);
}

export function vibrateKey(): void {
  if (typeof navigator.vibrate !== 'function') {
    return;
  }
  navigator.vibrate(10);
}
