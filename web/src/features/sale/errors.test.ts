import { describe, expect, it } from 'vitest';
import { ApiError } from '../../api/client';
import { classifySaleError } from './errors';

describe('sale errors', () => {
  it('maps validation, rate limit, gateway, and network failures', () => {
    expect(
      classifySaleError(
        new ApiError({
          code: 'VALIDATION_ERROR',
          message: 'Bad',
          status: 400,
          issues: [{ path: 'phone', message: 'Invalid phone' }],
        }),
      ),
    ).toEqual({ kind: 'validation', issues: ['Invalid phone'] });
    expect(
      classifySaleError(new ApiError({ code: 'RATE_LIMITED', message: 'Slow', status: 429 })),
    ).toEqual({ kind: 'rate' });
    expect(
      classifySaleError(new ApiError({ code: 'INTERNAL', message: 'Down', status: 502 })),
    ).toEqual({ kind: 'unavailable' });
    expect(
      classifySaleError(new ApiError({ code: 'TIMEOUT', message: 'Slow', status: 0 })),
    ).toEqual({ kind: 'network' });
    expect(
      classifySaleError(new ApiError({ code: 'CONFLICT', message: 'Gone', status: 409 })),
    ).toEqual({ kind: 'conflict' });
  });
});
