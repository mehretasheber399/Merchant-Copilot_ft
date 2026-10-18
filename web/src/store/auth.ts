import { create } from 'zustand';
import { getMe } from '../api/endpoints';
import { ApiError } from '../api/client';
import { clearStoredSession, readStoredSession, writeStoredSession } from '../auth/storage';
import type { Merchant } from '../shared/types';

interface AuthState {
  token: string | null;
  merchant: Merchant | null;
  setSession: (token: string, merchant: Merchant) => void;
  clearSession: () => void;
  hydrate: () => void;
}

const initial = readStoredSession();

export const useAuthStore = create<AuthState>((set) => ({
  token: initial?.token ?? null,
  merchant: initial?.merchant ?? null,
  setSession: (token, merchant) => {
    writeStoredSession({ token, merchant });
    set({ token, merchant });
  },
  clearSession: () => {
    clearStoredSession();
    set({ token: null, merchant: null });
  },
  hydrate: () => {
    const session = readStoredSession();
    set({
      token: session?.token ?? null,
      merchant: session?.merchant ?? null,
    });
  },
}));

let validationStarted = false;

export function validateSession(): Promise<void> {
  if (validationStarted) {
    return Promise.resolve();
  }
  validationStarted = true;
  const token = useAuthStore.getState().token;
  if (!token) {
    return Promise.resolve();
  }
  return getMe()
    .then((merchant) => {
      if (useAuthStore.getState().token !== token) {
        return;
      }
      useAuthStore.getState().setSession(token, merchant);
    })
    .catch((error: unknown) => {
      if (error instanceof ApiError && error.status === 401) {
        useAuthStore.getState().clearSession();
      }
    });
}
