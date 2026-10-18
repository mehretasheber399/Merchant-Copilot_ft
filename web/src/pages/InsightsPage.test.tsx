import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../api/client';
import {
  dismissTransactionMapping,
  getInsightEvidence,
  getInsights,
  listProducts,
  listUnmappedTransactions,
  mapTransaction,
  refreshInsights,
} from '../api/endpoints';
import { ToastViewport } from '../components/ui/Toast';
import i18n from '../i18n';
import type { InsightsPayload, ProductView, UnmappedTransaction } from '../shared/types';
import { useAuthStore } from '../store/auth';
import { useLocaleStore } from '../store/locale';
import { useToastStore } from '../store/toast';
import { resetStreamForTests } from '../stream/stream';
import { InsightsPage } from './InsightsPage';

vi.mock('../api/endpoints', async () => {
  const actual = await vi.importActual<typeof import('../api/endpoints')>('../api/endpoints');
  return {
    ...actual,
    getInsights: vi.fn(),
    refreshInsights: vi.fn(),
    getInsightEvidence: vi.fn(),
    listUnmappedTransactions: vi.fn(),
    mapTransaction: vi.fn(),
    dismissTransactionMapping: vi.fn(),
    listProducts: vi.fn(),
    getMe: vi.fn(),
  };
});

const getInsightsMock = vi.mocked(getInsights);
const refreshInsightsMock = vi.mocked(refreshInsights);
const getEvidenceMock = vi.mocked(getInsightEvidence);
const listUnmappedMock = vi.mocked(listUnmappedTransactions);
const mapTransactionMock = vi.mocked(mapTransaction);
const dismissMock = vi.mocked(dismissTransactionMapping);
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

function payload(insights: InsightsPayload['insights']): InsightsPayload {
  return {
    insights,
    briefing: { en: 'Collections are up.', am: 'ገቢ ጨምሯል።', source: 'llm' },
  };
}

function cards(): InsightsPayload['insights'] {
  return [
    {
      id: undefined,
      type: 'unusualDropOrSpike',
      priority: 2,
      what: { en: 'Sales look unusual', am: 'ሽያጭ ያልተለመደ ይመስላል' },
      why: { en: 'It jumped in one hour.', am: 'በአንድ ሰዓት ጨምሯል።' },
      check: { en: 'Check the busy hour.', am: 'የተጨናነቀውን ሰዓት ይመልከቱ።' },
      nextAction: { en: 'Restock the fast item.', am: 'ፈጣኑን እቃ ይሙሉ።' },
      confidence: 'estimate',
      evidenceTransactionIds: [],
      calc: [],
      dateKey: '2026-10-18',
    },
    {
      id: 'insight-1',
      type: 'lowStockRisk',
      priority: 1,
      what: { en: 'Oil is running out', am: 'ዘይት እያለቀ ነው' },
      why: { en: 'Less than two days left.', am: 'ከሁለት ቀን በታች ቀርቷል።' },
      check: { en: 'Count the bottles.', am: 'ጠርሙሶቹን ይቁጠሩ።' },
      nextAction: { en: 'Buy more oil today.', am: 'ዛሬ ተጨማሪ ዘይት ይግዙ።' },
      confidence: 'high',
      evidenceTransactionIds: ['t1'],
      calc: [{ label: { en: 'Items at risk', am: 'አደጋ ላይ' }, value: 'Oil' }],
      dateKey: '2026-10-18',
    },
  ];
}

function sugar(): ProductView {
  return {
    id: 'p1',
    merchantId: 'm1',
    name: 'Sugar',
    nameAm: 'ስኳር',
    price: 250,
    category: 'Grocery',
    isActive: true,
    isDemo: false,
    stockStatus: 'ok',
  };
}

function payment(
  partial: Partial<UnmappedTransaction> & Pick<UnmappedTransaction, 'id'>,
): UnmappedTransaction {
  return {
    amount: 250,
    timestamp: '2026-10-18T09:00:00.000Z',
    externalReference: 'ref',
    mappingSource: 'unmapped',
    phoneMasked: '2519****5678',
    suggestion: {
      items: [{ productId: 'p1', name: 'Sugar', qty: 1 }],
      total: 250,
      exact: true,
      score: 1,
    },
    ...partial,
  };
}

function renderInsights() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={['/insights']}>
          <InsightsPage />
          <ToastViewport />
        </MemoryRouter>
      </I18nextProvider>
    </QueryClientProvider>,
  );
  return client;
}

describe('insights', () => {
  beforeEach(() => {
    FakeEventSource.instances = [];
    vi.stubGlobal('EventSource', FakeEventSource);
    resetStreamForTests();
    useToastStore.setState({ toasts: [] });
    getInsightsMock.mockReset();
    refreshInsightsMock.mockReset();
    getEvidenceMock.mockReset();
    listUnmappedMock.mockReset();
    mapTransactionMock.mockReset();
    dismissMock.mockReset();
    listProductsMock.mockReset();
    getInsightsMock.mockResolvedValue(payload(cards()));
    refreshInsightsMock.mockResolvedValue(payload(cards()));
    listUnmappedMock.mockResolvedValue([]);
    listProductsMock.mockResolvedValue([sugar()]);
    getEvidenceMock.mockResolvedValue({
      insight: cards()[1]!,
      calc: [{ label: { en: 'Items at risk', am: 'አደጋ ላይ' }, value: 'Oil' }],
      transactions: [
        {
          id: 't1',
          amount: 250,
          timestamp: '2026-10-18T09:00:00.000Z',
          items: [{ name: 'Oil', qty: 1 }],
        },
      ],
    });
    mapTransactionMock.mockResolvedValue({ id: 'tx', mappingSource: 'manual' });
    dismissMock.mockResolvedValue({ id: 'tx', dismissed: true });
  });

  it('renders cards in both languages, with badges, and hides evidence without an id', async () => {
    renderInsights();
    expect(await screen.findByText('Collections are up.')).toBeInTheDocument();
    expect(screen.getByText('AI')).toBeInTheDocument();
    const titles = screen.getAllByRole('heading', { level: 2 }).map((node) => node.textContent);
    expect(titles.indexOf('Oil is running out')).toBeLessThan(titles.indexOf('Sales look unusual'));
    expect(screen.getAllByText('Why it matters')).toHaveLength(2);
    expect(screen.getAllByText('What to check')).toHaveLength(2);
    expect(screen.getByText('Buy more oil today.')).toBeInTheDocument();
    expect(screen.getByText('High').className).toContain('border-solid');
    expect(screen.getByText('Estimate').className).toContain('border-dashed');
    expect(screen.getAllByRole('button', { name: 'See evidence' })).toHaveLength(1);

    useLocaleStore.getState().setLocale('am');
    expect(await screen.findByText('ዘይት እያለቀ ነው')).toBeInTheDocument();
    expect(screen.getByText('ሽያጭ ያልተለመደ ይመስላል')).toBeInTheDocument();
    expect(screen.getAllByText('ለምን አስፈላጊ ነው').length).toBeGreaterThan(0);
    expect(screen.getByText('ገቢ ጨምሯል።')).toBeInTheDocument();
  });

  it('opens the evidence drawer, focuses it, and closes with Escape', async () => {
    const user = userEvent.setup();
    renderInsights();
    await screen.findByRole('button', { name: 'See evidence' });
    await user.click(screen.getByRole('button', { name: 'See evidence' }));
    const dialog = await screen.findByRole('dialog', { name: 'Evidence' });
    expect(dialog.contains(document.activeElement)).toBe(true);
    expect(await screen.findByText('Items at risk')).toBeInTheDocument();
    expect(screen.getByText('Oil')).toBeInTheDocument();
    expect(screen.getByText('250 ETB')).toBeInTheDocument();
    expect(screen.getByText('Oil × 1')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows a total mismatch, an already-matched payment, and dismisses a row', async () => {
    const user = userEvent.setup();
    listUnmappedMock.mockResolvedValue([
      payment({ id: 'bad' }),
      payment({ id: 'taken' }),
      payment({ id: 'gone', suggestion: null, amount: 80 }),
    ]);
    mapTransactionMock.mockImplementation(async (id) => {
      if (id === 'bad') {
        throw new ApiError({ code: 'VALIDATION_ERROR', message: 'no', status: 400 });
      }
      throw new ApiError({ code: 'CONFLICT', message: 'no', status: 409 });
    });
    renderInsights();
    expect(await screen.findAllByText('2519****5678')).toHaveLength(3);
    const confirms = await screen.findAllByRole('button', { name: 'Confirm' });
    await user.click(confirms[0]!);
    expect(await screen.findByText("Items don't add up to the payment.")).toBeInTheDocument();
    await user.click(screen.getAllByRole('button', { name: 'Confirm' })[1]!);
    expect(await screen.findByText('Already matched.')).toBeInTheDocument();
    expect(screen.getByText('No match found')).toBeInTheDocument();

    const dismissButtons = screen.getAllByRole('button', { name: 'Dismiss' });
    await user.click(dismissButtons[2]!);
    const ask = screen.getByText('Remove this payment from review?');
    await user.click(
      within(ask.parentElement as HTMLElement).getByRole('button', { name: 'Dismiss' }),
    );
    expect(dismissMock).toHaveBeenCalledWith('gone');
  });

  it('confirms an edited basket only when the total matches', async () => {
    const user = userEvent.setup();
    listUnmappedMock.mockResolvedValue([payment({ id: 'edit-1', amount: 500, suggestion: null })]);
    const client = renderInsights();
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    await user.click(await screen.findByRole('button', { name: 'Edit items' }));
    await user.selectOptions(await screen.findByLabelText('Add item'), 'p1');
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Increase Sugar' }));
    expect(screen.getByText('500 ETB of 500 ETB')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(await screen.findByText('Payment matched to items')).toBeInTheDocument();
    expect(mapTransactionMock).toHaveBeenCalledWith('edit-1', [{ productId: 'p1', qty: 2 }]);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['insights'] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['stock'] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['dashboard'] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['transactions'] });
  });

  it('shows empty states, refreshes, and refetches on live events', async () => {
    const user = userEvent.setup();
    getInsightsMock.mockResolvedValue(
      payload([
        {
          ...cards()[1]!,
          id: 'insight-1',
        },
      ]),
    );
    getInsightsMock.mockResolvedValueOnce(payload([]));
    getEvidenceMock.mockResolvedValue({
      insight: { ...cards()[1]!, id: 'insight-1' },
      calc: [],
      transactions: [],
    });
    useAuthStore.getState().setSession('tok', { id: 'm1', businessName: 'Shop' });
    renderInsights();
    expect(
      await screen.findByText('No insights yet. Refresh after a few sales.'),
    ).toBeInTheDocument();
    expect(screen.getByText('No payments need review.')).toBeInTheDocument();

    refreshInsightsMock.mockResolvedValue(payload(cards()));
    await user.click(screen.getByRole('button', { name: 'Refresh' }));
    expect(await screen.findByText('Oil is running out')).toBeInTheDocument();

    const calls = getInsightsMock.mock.calls.length;
    act(() => {
      FakeEventSource.instances.at(-1)?.emit('insight.updated', { merchantId: 'm1' });
    });
    await vi.waitFor(() => {
      expect(getInsightsMock.mock.calls.length).toBeGreaterThan(calls);
    });

    listUnmappedMock.mockResolvedValue([payment({ id: 'live' })]);
    act(() => {
      FakeEventSource.instances.at(-1)?.emit('sale.updated', {
        merchantId: 'm1',
        requestId: 'req',
        status: 'PAID',
        amount: 250,
      });
    });
    expect(await screen.findByText('Sugar × 1')).toBeInTheDocument();
  });
});
