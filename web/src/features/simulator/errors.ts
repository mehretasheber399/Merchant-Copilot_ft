import { ApiError } from '../../api/client';

export type SimFailure =
  | { kind: 'network' }
  | { kind: 'rate' }
  | { kind: 'unavailable' }
  | { kind: 'unknown' }
  | { kind: 'conflict' }
  | { kind: 'generic' };

export function classifySimError(error: unknown): SimFailure {
  if (
    !(error instanceof ApiError) ||
    error.code === 'NETWORK_ERROR' ||
    error.code === 'TIMEOUT' ||
    error.status === 0
  ) {
    return { kind: 'network' };
  }
  if (error.status === 429 || error.code === 'RATE_LIMITED') {
    return { kind: 'rate' };
  }
  if (error.status === 409 || error.code === 'CONFLICT') {
    return { kind: 'conflict' };
  }
  if (error.status === 404) {
    if (error.code === 'NOT_FOUND' && /request|expired|sale/i.test(error.message)) {
      return { kind: 'unknown' };
    }
    return { kind: 'unavailable' };
  }
  return { kind: 'generic' };
}
