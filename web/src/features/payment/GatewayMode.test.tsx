import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../../api/client';
import {
  getGatewayMode,
  getSale,
  listProducts,
  requestSale,
  setGatewayMode,
} from '../../api/endpoints';
import { TopBar } from '../../components/layout/TopBar';
import { ToastViewport } from '../../components/ui/Toast';
import i18n from '../../i18n';
import { SalePage } from '../../pages/SalePage';
import type { ProductView, SaleRequestView } from '../../shared/types';
import { useAuthStore } from '../../store/auth';
import { useCartStore } from '../../store/cart';
import { useToastStore } from '../../store/toast';
import { resetStreamForTests, useStreamStatus } from '../../stream/stream';
import { rememberSale } from '../sale/session';

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

  close() {
    this.closed = true;
  }
}

vi.mock('../../api/endpoints', async () => {
  const actual = await vi.importActual<typeof import('../../api/endpoints')>('../../api/endpoints');
  return {
    ...actual,
    getGatewayMode: vi.fn(),
    setGatewayMode: vi.fn(),
    listProducts: vi.fn(),
    resetDemo: vi.fn(),
    simulateSale: vi.fn(),
    simulateDirectPayment: vi.fn(),
    drainStock: vi.fn(),
    requestSale: vi.fn(),
    getSale: vi.fn(),
    cancelSale: vi.fn(),
    getMe: vi.fn(),
  };
});

const getGatewayModeMock = vi.mocked(getGatewayMode);
const setGatewayModeMock = vi.mocked(setGatewayMode);
const listProductsMock = vi.mocked(listProducts);
const requestSaleMock = vi.mocked(requestSale);
const getSaleMock = vi.mocked(getSale);

function product(): ProductView {
  return {
    id: 'p1',
    merchantId: 'm1',
    name: 'Sugar',
    nameAm: 'ስኳር',
    price: 100,
    stock: 5,
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
    warnings: [],
    gateway: 'mock',
    ...overrides,
  };
}

function wrap(ui: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          {ui}
          <ToastViewport />
        </MemoryRouter>
      </I18nextProvider>
    </QueryClientProvider>,
  );
}

describe('gateway mode UI', () => {
  beforeEach(() => {
    FakeEventSource.instances = [];
    vi.stubGlobal('EventSource', FakeEventSource);
    resetStreamForTests();
    useStreamStatus.setState({ connected: false });
    useToastStore.setState({ toasts: [] });
    useCartStore.getState().clear();
    useAuthStore.getState().clearSession();
    useAuthStore.getState().setSession('tok', { id: 'm1', businessName: 'Shop' });
    sessionStorage.clear();
    getGatewayModeMock.mockReset();
    setGatewayModeMock.mockReset();
    listProductsMock.mockReset();
    requestSaleMock.mockReset();
    getSaleMock.mockReset();
    listProductsMock.mockResolvedValue([product()]);
    getGatewayModeMock.mockResolvedValue({ mode: 'mock', switchable: true });
    setGatewayModeMock.mockResolvedValue({ mode: 'mpesa', switchable: true });
  });

  it('hides the payment mode toggle when the endpoint returns 404', async () => {
    const user = userEvent.setup();
    getGatewayModeMock.mockRejectedValue(
      new ApiError({ code: 'NOT_FOUND', message: 'off', status: 404 }),
    );
    wrap(<TopBar />);
    await user.click(screen.getByRole('button', { name: 'Menu' }));
    await waitFor(() => expect(getGatewayModeMock).toHaveBeenCalled());
    expect(screen.queryByText('Payment mode')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Live M-PESA sandbox' })).not.toBeInTheDocument();
  });

  it('requires confirm before POST /demo/gateway', async () => {
    const user = userEvent.setup();
    wrap(<TopBar />);
    await user.click(screen.getByRole('button', { name: 'Menu' }));
    expect(await screen.findByText('Payment mode')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Live M-PESA sandbox' }));
    expect(setGatewayModeMock).not.toHaveBeenCalled();
    expect(screen.getByText(/New sales will use the real M-PESA sandbox/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Switch now' }));
    await waitFor(() => expect(setGatewayModeMock).toHaveBeenCalledWith('mpesa'));
    expect(await screen.findByText('Payment mode updated')).toBeInTheDocument();
  });

  it('does not show the customer-sim link for mpesa sales', async () => {
    rememberSale('req-1');
    getSaleMock.mockResolvedValue(sale({ gateway: 'mpesa' }));
    wrap(<SalePage />);
    expect(
      await screen.findByText('Ask the customer to check their phone and enter their M-PESA PIN'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Open customer phone' })).not.toBeInTheDocument();
    expect(screen.getByText('LIVE M-PESA SANDBOX')).toBeInTheDocument();
  });

  it('shows M-PESA unavailable with switch option on 502 and does not resubmit after switching', async () => {
    const user = userEvent.setup();
    getGatewayModeMock.mockResolvedValue({ mode: 'mpesa', switchable: true });
    setGatewayModeMock.mockResolvedValue({ mode: 'mock', switchable: true });
    requestSaleMock.mockRejectedValue(
      new ApiError({ code: 'INTERNAL', message: 'Down', status: 502 }),
    );
    wrap(<SalePage />);

    await user.click(await screen.findByRole('button', { name: 'Add' }));
    await user.type(screen.getByLabelText('Customer phone'), '0912345678');
    await user.click(screen.getByRole('button', { name: 'Request payment' }));

    expect(await screen.findByText('M-PESA sandbox unavailable')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Switch to simulated mode' })).toBeInTheDocument();
    expect(requestSaleMock).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Switch to simulated mode' }));
    expect(setGatewayModeMock).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Switch now' }));
    await waitFor(() => expect(setGatewayModeMock).toHaveBeenCalledWith('mock'));
    expect(requestSaleMock).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Request payment' })).toBeInTheDocument();
    expect(screen.getByLabelText('Customer phone')).toHaveValue('0912345678');
    expect(screen.getByRole('button', { name: 'Increase Sugar' })).toBeInTheDocument();
  });
});
