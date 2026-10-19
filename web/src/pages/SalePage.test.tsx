import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../api/client';
import { getSale, listProducts, requestSale } from '../api/endpoints';
import i18n from '../i18n';
import type { ProductView, SaleRequestView, SaleUpdatedEvent } from '../shared/types';
import { useAuthStore } from '../store/auth';
import { useCartStore } from '../store/cart';
import { useLiveSale } from '../hooks/useLiveSale';
import { resetStreamForTests, useStreamStatus } from '../stream/stream';
import { rememberSale } from '../features/sale/session';
import { SalePage } from './SalePage';

vi.mock('../api/endpoints', async () => {
  const actual = await vi.importActual<typeof import('../api/endpoints')>('../api/endpoints');
  return {
    ...actual,
    listProducts: vi.fn(),
    requestSale: vi.fn(),
    getSale: vi.fn(),
    cancelSale: vi.fn(),
    getMe: vi.fn(),
  };
});

const listProductsMock = vi.mocked(listProducts);
const requestSaleMock = vi.mocked(requestSale);
const getSaleMock = vi.mocked(getSale);

class FakeEventSource {
  static instances: FakeEventSource[] = [];
  url = '';
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

  emit(type: string, data: unknown) {
    const event = { data: JSON.stringify(data) } as MessageEvent<string>;
    this.listeners.get(type)?.forEach((listener) => listener(event));
  }

  close() {
    this.closed = true;
  }
}

function product(): ProductView {
  return {
    id: 'p1',
    merchantId: 'm1',
    name: 'Sugar',
    nameAm: 'ስኳር',
    price: 100,
    stock: 1,
    category: 'Grocery',
    isActive: true,
    isDemo: false,
    stockStatus: 'ok',
  };
}

function sale(overrides: Partial<SaleRequestView> = {}): SaleRequestView {
  return {
    requestId: 'req-1',
    status: 'PENDING',
    amount: 200,
    items: [{ productId: 'p1', name: 'Sugar', qty: 2, price: 100 }],
    phoneMasked: '2519****5678',
    expiresAt: '2000-01-01T00:00:00.000Z',
    secondsLeft: 60,
    warnings: ['Low stock'],
    ...overrides,
  };
}

function renderSale() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <I18nextProvider i18n={i18n}>
        <SalePage />
      </I18nextProvider>
    </QueryClientProvider>,
  );
}

async function openPayment(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'View cart' }));
  await user.click(screen.getByRole('button', { name: 'Continue to payment' }));
}

async function fillSale(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole('button', { name: 'Add' }));
  await user.click(screen.getByRole('button', { name: 'Increase Sugar' }));
  await openPayment(user);
  await user.type(screen.getByLabelText('Customer phone'), '0912345678');
}

async function addAndRequest(user: ReturnType<typeof userEvent.setup>) {
  await fillSale(user);
  await user.click(screen.getByRole('button', { name: 'Request payment' }));
}

describe('sale screen', () => {
  beforeEach(() => {
    FakeEventSource.instances = [];
    vi.stubGlobal('EventSource', FakeEventSource);
    resetStreamForTests();
    sessionStorage.clear();
    useCartStore.getState().clear();
    useAuthStore.getState().clearSession();
    useAuthStore.getState().setSession('tok', { id: 'm1', businessName: 'Shop' });
    useStreamStatus.setState({ connected: false });
    listProductsMock.mockReset();
    requestSaleMock.mockReset();
    getSaleMock.mockReset();
    listProductsMock.mockResolvedValue([product()]);
  });

  it('shows the local total and counts down from secondsLeft', async () => {
    const user = userEvent.setup();
    const pending = sale();
    requestSaleMock.mockResolvedValue(pending);
    getSaleMock.mockResolvedValue(pending);
    renderSale();

    await fillSale(user);
    expect(screen.getByText('200 ETB')).toBeInTheDocument();
    expect(screen.getByText('Only 1 in stock.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Request payment' }));

    expect(await screen.findByText('60s left')).toBeInTheDocument();
    expect(screen.getByText('2519****5678')).toBeInTheDocument();
    expect(screen.getByText('Low stock')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open customer phone' })).toHaveAttribute(
      'href',
      '/customer-sim?requestId=req-1',
    );
    expect(requestSaleMock).toHaveBeenCalledWith(
      { phone: '0912345678', items: [{ productId: 'p1', qty: 2 }] },
      expect.any(String),
    );
    expect(screen.getByText('200 ETB')).toBeInTheDocument();
  });

  it('rejects an invalid phone before requesting payment', async () => {
    const user = userEvent.setup();
    renderSale();
    await user.click(await screen.findByRole('button', { name: 'Add' }));
    await openPayment(user);
    await user.type(screen.getByLabelText('Customer phone'), '0812345678');
    await user.click(screen.getByRole('button', { name: 'Request payment' }));
    expect(screen.getByText('Enter a valid M-PESA number.')).toBeInTheDocument();
    expect(requestSaleMock).not.toHaveBeenCalled();
  });

  it('reuses the idempotency key after a timeout and uses a new key for the next sale', async () => {
    const user = userEvent.setup();
    requestSaleMock
      .mockRejectedValueOnce(new ApiError({ code: 'TIMEOUT', message: 'slow', status: 0 }))
      .mockResolvedValueOnce(sale())
      .mockResolvedValueOnce(sale({ requestId: 'req-2' }));
    getSaleMock.mockResolvedValue(sale());
    renderSale();

    await addAndRequest(user);
    expect(await screen.findByRole('alert')).toHaveTextContent('Cannot reach the server.');
    await user.click(screen.getByRole('button', { name: 'Request payment' }));
    expect(await screen.findByText('60s left')).toBeInTheDocument();

    const firstKey = requestSaleMock.mock.calls[0]?.[1];
    const retryKey = requestSaleMock.mock.calls[1]?.[1];
    expect(firstKey).toBe(retryKey);

    act(() => {
      FakeEventSource.instances[0]?.emit('sale.updated', {
        merchantId: 'm1',
        requestId: 'req-1',
        status: 'DECLINED',
        amount: 200,
      });
    });
    getSaleMock.mockResolvedValue(sale({ requestId: 'req-2' }));
    await user.click(await screen.findByRole('button', { name: 'New sale' }));
    await addAndRequest(user);
    expect(await screen.findByText('60s left')).toBeInTheDocument();
    expect(requestSaleMock.mock.calls[2]?.[1]).not.toBe(firstKey);
  });

  it('follows sale.updated events and shows a late payment', async () => {
    const user = userEvent.setup();
    const pending = sale();
    requestSaleMock.mockResolvedValue(pending);
    getSaleMock.mockResolvedValue(pending);
    renderSale();
    await addAndRequest(user);
    expect(await screen.findByText('60s left')).toBeInTheDocument();

    const source = FakeEventSource.instances[0];
    const declined: SaleUpdatedEvent = {
      merchantId: 'm1',
      requestId: 'req-1',
      status: 'DECLINED',
      amount: 200,
    };
    act(() => source?.emit('sale.updated', declined));
    expect(await screen.findByRole('heading', { name: 'Wrong PIN' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'New sale' }));
    requestSaleMock.mockResolvedValue(sale({ requestId: 'req-3' }));
    getSaleMock.mockResolvedValue(sale({ requestId: 'req-3' }));
    await addAndRequest(user);
    expect(await screen.findByText('60s left')).toBeInTheDocument();
    const next = FakeEventSource.instances.at(-1);
    act(() =>
      next?.emit('sale.updated', {
        merchantId: 'm1',
        requestId: 'req-3',
        status: 'TIMEOUT',
        amount: 200,
      }),
    );
    expect(
      await screen.findByRole('heading', { name: 'Customer did not respond' }),
    ).toBeInTheDocument();
    act(() =>
      next?.emit('sale.updated', {
        merchantId: 'm1',
        requestId: 'req-3',
        status: 'PAID',
        amount: 200,
        lateConfirmation: true,
      }),
    );
    expect(await screen.findByText('Payment arrived late - recorded')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Transaction details' })).toBeInTheDocument();
    expect(screen.getByText('Sugar × 2')).toBeInTheDocument();
  });

  it('returns to the waiting sale after reload', async () => {
    rememberSale('req-1');
    getSaleMock.mockResolvedValue(sale());
    renderSale();
    expect(await screen.findByText('60s left')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Request payment' })).not.toBeInTheDocument();
  });
});

describe('sale polling', () => {
  beforeEach(() => {
    FakeEventSource.instances = [];
    vi.stubGlobal('EventSource', FakeEventSource);
    resetStreamForTests();
    useAuthStore.getState().clearSession();
    useAuthStore.getState().setSession('tok', { id: 'm1', businessName: 'Shop' });
    useStreamStatus.setState({ connected: false });
    getSaleMock.mockReset();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('polls every 3 seconds only while the stream is disconnected', async () => {
    getSaleMock.mockResolvedValue(sale());
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    function wrapper({ children }: { children: ReactNode }) {
      return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    }
    const { result } = renderHook(() => useLiveSale('req-1'), { wrapper });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(result.current.data?.status).toBe('PENDING');
    expect(getSaleMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    expect(getSaleMock).toHaveBeenCalledTimes(2);

    act(() => {
      FakeEventSource.instances[0]?.onopen?.();
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    expect(getSaleMock).toHaveBeenCalledTimes(2);
  });
});
