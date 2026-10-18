import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AUTH_STORAGE_KEY, readStoredSession } from '../auth/storage';
import { useAuthStore } from './auth';

const merchant = { id: 'm1', businessName: 'Abebe Mini Market' };

describe('auth store', () => {
  beforeEach(() => {
    useAuthStore.getState().clearSession();
    localStorage.clear();
  });

  it('persists the token and merchant, then rehydrates', () => {
    useAuthStore.getState().setSession('tok', merchant);
    expect(readStoredSession()).toEqual({ token: 'tok', merchant });

    useAuthStore.getState().clearSession();
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ token: 'tok', merchant }));
    useAuthStore.getState().hydrate();

    expect(useAuthStore.getState().token).toBe('tok');
    expect(useAuthStore.getState().merchant?.businessName).toBe('Abebe Mini Market');
  });

  it('clears the session', () => {
    useAuthStore.getState().setSession('tok', merchant);
    useAuthStore.getState().clearSession();
    expect(useAuthStore.getState().token).toBeNull();
    expect(readStoredSession()).toBeNull();
  });

  it('ignores corrupt storage', () => {
    localStorage.setItem(AUTH_STORAGE_KEY, '{');
    useAuthStore.getState().hydrate();
    expect(useAuthStore.getState().token).toBeNull();
  });

  it('keeps the in-memory session if storage throws', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(() => useAuthStore.getState().setSession('tok', merchant)).not.toThrow();
    expect(useAuthStore.getState().token).toBe('tok');
    vi.restoreAllMocks();
  });
});
