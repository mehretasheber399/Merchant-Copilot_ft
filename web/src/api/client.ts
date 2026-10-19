import { readStoredSession } from '../auth/storage';
import { config, REQUEST_TIMEOUT_MS } from '../config';
import type { ApiIssue } from '../shared/types';

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly requestId: string;
  readonly issues: ApiIssue[];

  constructor(input: {
    code: string;
    message: string;
    status: number;
    requestId?: string;
    issues?: ApiIssue[];
  }) {
    super(input.message);
    this.name = 'ApiError';
    this.code = input.code;
    this.status = input.status;
    this.requestId = input.requestId ?? '';
    this.issues = input.issues ?? [];
  }
}

export interface RequestOptions {
  method?: string;
  body?: unknown;
  auth?: boolean;
  idempotencyKey?: string;
  skipAuthRedirect?: boolean;
  timeoutMs?: number;
}

type UnauthorizedHandler = () => void;

let onUnauthorized: UnauthorizedHandler = () => {};

export function setUnauthorizedHandler(handler: UnauthorizedHandler) {
  onUnauthorized = handler;
}

export function loginPathFor(pathname: string, search: string): string {
  const here = `${pathname}${search}`;
  if (!here.startsWith('/') || here.startsWith('//') || here.startsWith('/login')) {
    return '/login';
  }
  return `/login?returnTo=${encodeURIComponent(here)}`;
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException
    ? error.name === 'AbortError'
    : error instanceof Error && error.name === 'AbortError';
}

async function parseError(response: Response): Promise<ApiError> {
  try {
    const body = (await response.json()) as {
      error?: { code?: string; message?: string; requestId?: string; issues?: ApiIssue[] };
    };
    if (body.error?.code && body.error.message) {
      return new ApiError({
        code: body.error.code,
        message: body.error.message,
        status: response.status,
        requestId: body.error.requestId,
        issues: body.error.issues,
      });
    }
  } catch {
    // The body was not the error envelope.
  }
  return new ApiError({
    code: 'INTERNAL',
    message: response.statusText || 'Request failed',
    status: response.status,
  });
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? REQUEST_TIMEOUT_MS;
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (options.auth !== false) {
    const token = readStoredSession()?.token;
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }
  if (options.idempotencyKey) {
    headers['Idempotency-Key'] = options.idempotencyKey;
  }

  try {
    const response = await fetch(`${config.apiBaseUrl}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });

    if (response.status === 401 && !options.skipAuthRedirect) {
      const error = await parseError(response);
      onUnauthorized();
      throw error;
    }
    if (!response.ok) {
      throw await parseError(response);
    }
    if (response.status === 204) {
      return undefined as T;
    }
    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (timedOut || isAbortError(error)) {
      throw new ApiError({ code: 'TIMEOUT', message: 'Request timed out', status: 0 });
    }
    throw new ApiError({ code: 'NETWORK_ERROR', message: 'Network error', status: 0 });
  } finally {
    clearTimeout(timer);
  }
}

export function filenameFromDisposition(header: string | null): string {
  if (!header) {
    return 'download';
  }
  const encoded = /filename\*=UTF-8''([^;]+)/i.exec(header);
  if (encoded?.[1]) {
    return decodeURIComponent(encoded[1]);
  }
  const plain = /filename="?([^";]+)"?/i.exec(header);
  return plain?.[1] ?? 'download';
}

export async function downloadAuthorized(
  path: string,
  timeoutMs = REQUEST_TIMEOUT_MS,
  lang?: 'en' | 'am',
): Promise<{ blob: Blob; filename: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const token = readStoredSession()?.token;
  try {
    const response = await fetch(`${config.apiBaseUrl}${path}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(lang ? { 'Accept-Language': lang } : {}),
      },
      signal: controller.signal,
    });
    if (response.status === 401) {
      const error = await parseError(response);
      onUnauthorized();
      throw error;
    }
    if (!response.ok) {
      throw await parseError(response);
    }
    const blob = await response.blob();
    return {
      blob,
      filename: filenameFromDisposition(response.headers.get('Content-Disposition')),
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError({ code: 'NETWORK_ERROR', message: 'Network error', status: 0 });
  } finally {
    clearTimeout(timer);
  }
}
