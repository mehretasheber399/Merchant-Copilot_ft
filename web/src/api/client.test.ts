import { afterEach, describe, expect, it, vi } from 'vitest';
import { writeStoredSession } from '../auth/storage';
import { ApiError, apiRequest, loginPathFor, setUnauthorizedHandler } from './client';
import { getMe, login } from './endpoints';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const fetchMock = vi.fn();

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('api client', () => {
  it('attaches the bearer token', async () => {
    writeStoredSession({
      token: 'jwt-1',
      merchant: { id: 'm1', businessName: 'Abebe Mini Market' },
    });
    fetchMock.mockResolvedValue(
      jsonResponse({ merchant: { id: 'm1', businessName: 'Abebe Mini Market' } }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await getMe();

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://localhost:3000/auth/me');
    expect(new Headers(init.headers).get('Authorization')).toBe('Bearer jwt-1');
  });

  it('parses the error envelope', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Bad',
            requestId: 'req-1',
            issues: [{ path: 'email', message: 'Required' }],
          },
        },
        400,
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiRequest('/products', { auth: false })).rejects.toMatchObject({
      name: 'ApiError',
      code: 'VALIDATION_ERROR',
      status: 400,
      requestId: 'req-1',
      issues: [{ path: 'email', message: 'Required' }],
    });
  });

  it('maps a network failure', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiRequest('/health', { auth: false })).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
      status: 0,
    });
  });

  it('redirects on 401 except for login', async () => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    fetchMock.mockImplementation(() =>
      Promise.resolve(
        jsonResponse({ error: { code: 'UNAUTHORIZED', message: 'expired', requestId: 'r1' } }, 401),
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(getMe()).rejects.toBeInstanceOf(ApiError);
    expect(handler).toHaveBeenCalledOnce();

    handler.mockClear();
    await expect(login('a@b.co', 'nope')).rejects.toMatchObject({
      status: 401,
      code: 'UNAUTHORIZED',
    });
    expect(handler).not.toHaveBeenCalled();
    expect(loginPathFor('/items', '?q=1')).toBe('/login?returnTo=%2Fitems%3Fq%3D1');
    expect(loginPathFor('/login', '')).toBe('/login');
  });

  it('times out after 15 seconds', async () => {
    vi.useFakeTimers();
    fetchMock.mockImplementation((_url: string, init?: RequestInit) => {
      return new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          const error = new Error('aborted');
          error.name = 'AbortError';
          reject(error);
        });
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    const pending = apiRequest('/health', { auth: false });
    const assertion = expect(pending).rejects.toMatchObject({ code: 'TIMEOUT', status: 0 });
    await vi.advanceTimersByTimeAsync(15_000);
    await assertion;
  });

  it('sends an idempotency key when one is provided', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ sale: { requestId: 's1' } }));
    vi.stubGlobal('fetch', fetchMock);

    await apiRequest('/sales/request', { method: 'POST', body: {}, idempotencyKey: 'key-1' });

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(new Headers(init.headers).get('Idempotency-Key')).toBe('key-1');
  });
});
