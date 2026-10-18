import type { Merchant } from '../shared/types';

export const AUTH_STORAGE_KEY = 'mpesa-copilot-auth';

export interface StoredSession {
  token: string;
  merchant: Merchant;
}

function isMerchant(value: unknown): value is Merchant {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const merchant = value as Merchant;
  return typeof merchant.id === 'string' && typeof merchant.businessName === 'string';
}

export function readStoredSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as { token?: unknown; merchant?: unknown };
    if (typeof parsed.token !== 'string' || !isMerchant(parsed.merchant)) {
      return null;
    }
    return { token: parsed.token, merchant: parsed.merchant };
  } catch {
    return null;
  }
}

export function writeStoredSession(session: StoredSession): void {
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Private mode or a full disk should not block the in-memory session.
  }
}

export function clearStoredSession(): void {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {
    // Ignore storage failures.
  }
}
