import { act, render, waitFor } from '@testing-library/react';
import { StrictMode, useEffect } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../api/client';
import { getMe } from '../api/endpoints';
import { useAuthStore } from '../store/auth';
import { resetStreamForTests, retainStream, subscribe, useStreamStatus } from './stream';

vi.mock('../api/endpoints', async () => {
  const actual = await vi.importActual<typeof import('../api/endpoints')>('../api/endpoints');
  return { ...actual, getMe: vi.fn() };
});

const getMeMock = vi.mocked(getMe);

class FakeEventSource {
  static instances: FakeEventSource[] = [];
  url: string;
  closed = false;
  onerror: (() => void) | null = null;
  onopen: (() => void) | null = null;
  private listeners = new Map<string, Set<(event: Event) => void>>();

  constructor(url: string) {
    this.url = url;
    FakeEventSource.instances.push(this);
  }

  addEventListener(type: string, listener: (event: Event) => void) {
    const bucket = this.listeners.get(type) ?? new Set<(event: Event) => void>();
    bucket.add(listener);
    this.listeners.set(type, bucket);
  }

  close() {
    this.closed = true;
  }
}

function Probe() {
  useEffect(() => retainStream(), []);
  return null;
}

describe('payment stream', () => {
  beforeEach(() => {
    FakeEventSource.instances = [];
    vi.stubGlobal('EventSource', FakeEventSource);
    resetStreamForTests();
    useAuthStore.getState().clearSession();
    useAuthStore.getState().setSession('tok', { id: 'm1', businessName: 'Shop' });
    getMeMock.mockReset();
    getMeMock.mockResolvedValue({ id: 'm1', businessName: 'Shop' });
  });

  it('opens one EventSource when React mounts twice', async () => {
    render(
      <StrictMode>
        <Probe />
      </StrictMode>,
    );
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(FakeEventSource.instances).toHaveLength(1);
    expect(FakeEventSource.instances[0]?.closed).toBe(false);
    expect(FakeEventSource.instances[0]?.url).toContain('token=tok');
  });

  it('shares one connection between subscribers and closes it when the session ends', async () => {
    const stopA = subscribe('sale.updated', () => undefined);
    const stopB = subscribe('ready', () => undefined);
    expect(FakeEventSource.instances).toHaveLength(1);

    useAuthStore.getState().clearSession();
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(FakeEventSource.instances[0]?.closed).toBe(true);

    useAuthStore.getState().setSession('tok-2', { id: 'm1', businessName: 'Shop' });
    expect(FakeEventSource.instances).toHaveLength(2);
    expect(FakeEventSource.instances[1]?.closed).toBe(false);
    expect(useStreamStatus.getState().connected).toBe(false);

    stopA();
    stopB();
  });

  it('checks the session once when the stream errors and clears it on 401', async () => {
    getMeMock.mockRejectedValue(
      new ApiError({ code: 'UNAUTHORIZED', message: 'expired', status: 401 }),
    );
    const stop = retainStream();
    const source = FakeEventSource.instances[0];
    source?.onerror?.();
    source?.onerror?.();
    await waitFor(() => expect(useAuthStore.getState().token).toBeNull());
    expect(getMeMock).toHaveBeenCalledTimes(1);
    stop();
  });
});
