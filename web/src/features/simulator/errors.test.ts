import { describe, expect, it } from 'vitest';
import { ApiError } from '../../api/client';
import { classifySimError } from './errors';

describe('simulator errors', () => {
  it('maps network, rate limit, unavailable, unknown, and conflict', () => {
    expect(classifySimError(new Error('offline'))).toEqual({ kind: 'network' });
    expect(classifySimError(new ApiError({ code: 'TIMEOUT', message: 'Slow', status: 0 }))).toEqual(
      { kind: 'network' },
    );
    expect(
      classifySimError(new ApiError({ code: 'RATE_LIMITED', message: 'Slow', status: 429 })),
    ).toEqual({ kind: 'rate' });
    expect(
      classifySimError(new ApiError({ code: 'INTERNAL', message: 'Not Found', status: 404 })),
    ).toEqual({ kind: 'unavailable' });
    expect(
      classifySimError(
        new ApiError({ code: 'NOT_FOUND', message: 'Sale request expired', status: 404 }),
      ),
    ).toEqual({ kind: 'unknown' });
    expect(
      classifySimError(new ApiError({ code: 'CONFLICT', message: 'Closed', status: 409 })),
    ).toEqual({ kind: 'conflict' });
  });
});
