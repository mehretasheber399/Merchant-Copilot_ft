const SALE_SESSION_KEY = 'mpesa-copilot-sale';

interface StoredSale {
  requestId: string;
  paidAt?: string;
}

function read(): StoredSale | null {
  try {
    const raw = sessionStorage.getItem(SALE_SESSION_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as StoredSale;
    if (!parsed || typeof parsed.requestId !== 'string') {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function write(value: StoredSale | null) {
  try {
    if (!value) {
      sessionStorage.removeItem(SALE_SESSION_KEY);
      return;
    }
    sessionStorage.setItem(SALE_SESSION_KEY, JSON.stringify(value));
  } catch {
    // Private mode can reject sessionStorage. The sale still works until reload.
  }
}

export function readActiveSaleId(): string | null {
  return read()?.requestId ?? null;
}

export function readPaidAt(requestId: string): string | null {
  const stored = read();
  if (stored?.requestId !== requestId) {
    return null;
  }
  return stored.paidAt ?? null;
}

export function rememberSale(requestId: string) {
  const current = read();
  write({
    requestId,
    paidAt: current?.requestId === requestId ? current.paidAt : undefined,
  });
}

export function rememberPaidAt(requestId: string, paidAt: string) {
  const current = read();
  if (current?.requestId === requestId && current.paidAt) {
    return;
  }
  write({ requestId, paidAt });
}

export function clearActiveSale() {
  write(null);
}
