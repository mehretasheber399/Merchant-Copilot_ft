import { ApiError } from '../../api/client';

export type SaleFailure =
  | { kind: 'network' }
  | { kind: 'rate' }
  | { kind: 'unavailable' }
  | { kind: 'conflict' }
  | { kind: 'validation'; issues: string[] }
  | { kind: 'generic' };

export function classifySaleError(error: unknown): SaleFailure {
  if (!(error instanceof ApiError)) {
    return { kind: 'network' };
  }
  if (error.code === 'NETWORK_ERROR' || error.code === 'TIMEOUT' || error.status === 0) {
    return { kind: 'network' };
  }
  if (error.status === 429 || error.code === 'RATE_LIMITED') {
    return { kind: 'rate' };
  }
  if (error.status === 502) {
    return { kind: 'unavailable' };
  }
  if (error.status === 409 || error.code === 'CONFLICT') {
    return { kind: 'conflict' };
  }
  if (error.status === 400 || error.code === 'VALIDATION_ERROR') {
    return { kind: 'validation', issues: error.issues.map((issue) => issue.message) };
  }
  return { kind: 'generic' };
}

export function isNetworkFailure(error: unknown): boolean {
  return classifySaleError(error).kind === 'network';
}
