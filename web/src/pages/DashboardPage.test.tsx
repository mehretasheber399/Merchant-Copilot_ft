import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getDashboard,
  getDashboardHours,
  getStock,
  getTopProducts,
  listProducts,
  listTransactions,
} from '../api/endpoints';
import { ToastViewport } from '../components/ui/Toast';
import i18n from '../i18n';
import type {
  DashboardRange,
  DashboardView,
  HoursView,
  StockItem,
  TopProduct,
  TransactionPage,
  TransactionRow,
} from '../shared/types';
import { useAuthStore } from '../store/auth';
import { useToastStore } from '../store/toast';
import { resetStreamForTests } from '../stream/stream';
import { DashboardPage } from './DashboardPage';

vi.mock('../api/endpoints', async () => {
  const actual = await vi.importActual<typeof import('../api/endpoints')>('../api/endpoints');
  return {
    ...actual,
    getDashboard: vi.fn(),
    getDashboardHours: vi.fn(),
    getTopProducts: vi.fn(),
    getStock: vi.fn(),
    listTransactions: vi.fn(),
    listProducts: vi.fn(),
    getMe: vi.fn(),
  };
});

const getDashboardMock = vi.mocked(getDashboard);
const getHoursMock = vi.mocked(getDashboardHours);
const getTopProductsMock = vi.mocked(getTopProducts);
const getStockMock = vi.mocked(getStock);
const listTransactionsMock = vi.mocked(listTransactions);
const listProductsMock = vi.mocked(listProducts);

class FakeEventSource {
  static instances: FakeEventSource[] = [];
  url = '';
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

  close() {}
}

function dashboard(range: DashboardRange): DashboardView {
  const shared = {
    from: '2026-10-18T00:00:00.000Z',
    to: '2026-10-18T10:00:00.000Z',
    totalCollections: range === 'today' ? 5000 : 2000,
    transactionCount: 4,
    averageSale: 1250,
    dataCoverage: { mappedAmount: 4600, totalAmount: 5000, pct: 92 },
  };
  if (range === 'today') {
    return {
      range,
      ...shared,
      comparisons: {
        yesterday: { total: 4000, count: 2, deltaAbs: 1000, deltaPct: 12.5 },
        sameWeekdayLastWeek: { total: 3000, count: 3, deltaAbs: 2000, deltaPct: -4 },
        sevenDayAverage: { total: 3500, count: 3, deltaAbs: 0, deltaPct: null },
      },
    };
  }
  return {
    range,
    ...shared,
    comparisons: {
      previousPeriod: { total: 8000, count: 8, deltaAbs: -3000, deltaPct: -20 },
    },
  };
}

function hours(): HoursView {
  return {
    range: 'today',
    from: '2026-10-18T00:00:00.000Z',
    to: '2026-10-18T10:00:00.000Z',
    buckets: [{ hour: 9, label: '09:00', total: 800, count: 2 }],
    peakHours: [{ hour: 9, label: '09:00', total: 800, count: 2 }],
  };
}

function product(): TopProduct {
  return { productId: 'p1', name: 'Sugar', nameAm: 'ስኳር', qty: 3, revenue: 300 };
}

function stock(): StockItem[] {
  return [
    {
      productId: 'oil',
      name: 'Cooking oil',
      nameAm: 'ዘይት',
      stock: 1,
      reorderThreshold: 2,
      avgDailySales: 0,
      daysOfStockLeft: null,
      status: 'low',
    },
  ];
}

function transaction(id: string, amount: number): TransactionRow {
  return {
    id,
    amount,
    timestamp: '2026-10-18T09:00:00.000Z',
    mappingSource: 'cart',
    confidence: 'exact',
    items: [{ name: 'Sugar', qty: 1 }],
    phoneMasked: '2519****5678',
  };
}

function page(rows: TransactionRow[], nextCursor: string | null): TransactionPage {
  return { transactions: rows, nextCursor };
}

function renderDashboard(
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } }),
) {
  render(
    <QueryClientProvider client={client}>
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={['/dashboard']}>
          <DashboardPage />
          <ToastViewport />
        </MemoryRouter>
      </I18nextProvider>
    </QueryClientProvider>,
  );
  return client;
}

describe('dashboard', () => {
  beforeEach(() => {
    FakeEventSource.instances = [];
    vi.stubGlobal('EventSource', FakeEventSource);
    resetStreamForTests();
    useToastStore.setState({ toasts: [] });
    useAuthStore.getState().setSession('tok', { id: 'm1', businessName: 'Shop' });
    getDashboardMock.mockReset();
    getHoursMock.mockReset();
    getTopProductsMock.mockReset();
    getStockMock.mockReset();
    listTransactionsMock.mockReset();
    getDashboardMock.mockImplementation((range = 'today') => Promise.resolve(dashboard(range)));
    getHoursMock.mockResolvedValue(hours());
    getTopProductsMock.mockResolvedValue([product()]);
    getStockMock.mockResolvedValue(stock());
    listTransactionsMock.mockResolvedValue(page([transaction('t1', 100)], null));
    listProductsMock.mockResolvedValue([]);
  });

  it('shows today deltas, a null dash, and 24 chart buckets', async () => {
    renderDashboard();
    expect(await screen.findByText('+12.5% compared with yesterday')).toBeInTheDocument();
    expect(screen.getByText('-4.0% compared with this day last week')).toBeInTheDocument();
    expect(screen.getByText('- compared with a usual day')).toBeInTheDocument();
    expect(screen.getByText('92% of sales matched to products')).toBeInTheDocument();
    expect(screen.getByText('No sales data')).toBeInTheDocument();
    expect(screen.getByTestId('hour-chart')).toHaveAttribute('data-count', '24');
    expect(screen.getByText('2519****5678')).toBeInTheDocument();
  });

  it('switches week and month to the previous period', async () => {
    const user = userEvent.setup();
    renderDashboard();
    await screen.findByText('+12.5% compared with yesterday');
    await user.click(screen.getByRole('radio', { name: 'This week' }));
    expect(await screen.findByText('-20.0% compared with last time')).toBeInTheDocument();
    expect(screen.queryByText(/compared with yesterday/)).not.toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: 'This month' }));
    expect(await screen.findByText('-20.0% compared with last time')).toBeInTheDocument();
    expect(getDashboardMock).toHaveBeenCalledWith('week');
    expect(getDashboardMock).toHaveBeenCalledWith('month');
  });

  it('loads the next sales page without duplicating a row', async () => {
    const user = userEvent.setup();
    listTransactionsMock.mockImplementation(async (params) => {
      if (params?.cursor === 'c1') {
        return page([transaction('t2', 222), transaction('t3', 333)], null);
      }
      return page([transaction('t1', 111), transaction('t2', 222)], 'c1');
    });
    renderDashboard();
    expect(await screen.findByText('111 ETB')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Load more' }));
    expect(await screen.findByText('333 ETB')).toBeInTheDocument();
    expect(screen.getAllByText('222 ETB')).toHaveLength(1);
    expect(listTransactionsMock).toHaveBeenCalledWith({ limit: 20, cursor: 'c1' });
  });

  it('invalidates shop data, flashes the new sale, and toasts live events', async () => {
    let feed = page([transaction('t1', 100)], null);
    listTransactionsMock.mockImplementation(async () => feed);
    const client = renderDashboard();
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    await screen.findByText('100 ETB');
    const callsBefore = getDashboardMock.mock.calls.length;

    act(() => {
      FakeEventSource.instances.at(-1)?.emit('sale.updated', {
        merchantId: 'm1',
        requestId: 'req-9',
        status: 'DECLINED',
        amount: 250,
      });
    });
    expect(useToastStore.getState().toasts).toHaveLength(0);

    feed = page([transaction('t2', 250), transaction('t1', 100)], null);
    act(() => {
      FakeEventSource.instances.at(-1)?.emit('sale.updated', {
        merchantId: 'm1',
        requestId: 'req-9',
        status: 'PAID',
        amount: 250,
      });
    });
    expect(await screen.findByText('New sale 250 ETB')).toBeInTheDocument();
    expect(await screen.findByText('250 ETB')).toBeInTheDocument();
    expect(document.querySelector('[data-flash="true"]')).toBeTruthy();
    expect(getDashboardMock.mock.calls.length).toBeGreaterThan(callsBefore);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['dashboard'] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['hours'] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['top-products'] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['stock'] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['transactions'] });

    act(() => {
      FakeEventSource.instances.at(-1)?.emit('stock.low', {
        merchantId: 'm1',
        productId: 'oil',
        name: 'Cooking oil',
        stock: 1,
        threshold: 2,
      });
    });
    expect(await screen.findByText('Low stock: Cooking oil')).toBeInTheDocument();

    act(() => {
      FakeEventSource.instances.at(-1)?.emit('insight.updated', { merchantId: 'm1' });
    });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['insights'] });
  });

  it('shows empty states', async () => {
    getTopProductsMock.mockResolvedValue([]);
    getStockMock.mockResolvedValue([]);
    listTransactionsMock.mockResolvedValue(page([], null));
    renderDashboard();
    expect(await screen.findByText('No product sales yet.')).toBeInTheDocument();
    expect(screen.getByText('No stock to show.')).toBeInTheDocument();
    expect(screen.getByText('No sales yet.')).toBeInTheDocument();
  });
});
