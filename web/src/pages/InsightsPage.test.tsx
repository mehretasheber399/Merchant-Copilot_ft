import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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
import type { InsightsPayload, ProductView } from '../shared/types';
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
    expect(screen.queryByText('Why it matters')).not.toBeInTheDocument();
    expect(screen.getByText('Count the bottles.')).toBeInTheDocument();
    expect(screen.getByText('Buy more oil today.')).toBeInTheDocument();
    expect(screen.queryByText('Sure')).not.toBeInTheDocument();
    expect(screen.getByText('Rough figure').className).toContain('border-dashed');
    expect(screen.getAllByRole('button', { name: 'See the numbers' })).toHaveLength(1);

    useLocaleStore.getState().setLocale('am');
    expect(await screen.findByText('ዘይት እያለቀ ነው')).toBeInTheDocument();
    expect(screen.getByText('ሽያጭ ያልተለመደ ይመስላል')).toBeInTheDocument();
    expect(screen.getByText('ጠርሙሶቹን ይቁጠሩ።')).toBeInTheDocument();
    expect(screen.getByText('ገቢ ጨምሯል።')).toBeInTheDocument();
  });

  it('opens the evidence drawer, focuses it, and closes with Escape', async () => {
    const user = userEvent.setup();
    renderInsights();
    await screen.findByRole('button', { name: 'See the numbers' });
    await user.click(screen.getByRole('button', { name: 'See the numbers' }));
    const dialog = await screen.findByRole('dialog', { name: 'The numbers' });
    expect(dialog.contains(document.activeElement)).toBe(true);
    expect(within(dialog).getByText('Products running low')).toBeInTheDocument();
    expect(within(dialog).getByText('Oil')).toBeInTheDocument();
    expect(within(dialog).getByText('250 ETB')).toBeInTheDocument();
    expect(within(dialog).getByText('Oil × 1')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows an empty state and refetches on a live insight event', async () => {
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
    expect(await screen.findByText('No insights yet. Make a few sales first.')).toBeInTheDocument();
    expect(screen.queryByText('No payments need review.')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Refresh' })).not.toBeInTheDocument();

    const calls = getInsightsMock.mock.calls.length;
    act(() => {
      FakeEventSource.instances.at(-1)?.emit('insight.updated', { merchantId: 'm1' });
    });
    await vi.waitFor(() => {
      expect(getInsightsMock.mock.calls.length).toBeGreaterThan(calls);
    });
  });
});
