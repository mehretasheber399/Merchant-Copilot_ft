import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../api/client';
import { getMockPending, submitMockPin } from '../api/endpoints';
import i18n from '../i18n';
import type { MockPending, SaleRequestView, SaleStatus } from '../shared/types';
import { CustomerSimPage } from './CustomerSimPage';

vi.mock('../api/endpoints', async () => {
  const actual = await vi.importActual<typeof import('../api/endpoints')>('../api/endpoints');
  return { ...actual, getMockPending: vi.fn(), submitMockPin: vi.fn() };
});

const getMockPendingMock = vi.mocked(getMockPending);
const submitMockPinMock = vi.mocked(submitMockPin);

function pending(overrides: Partial<MockPending> = {}): MockPending {
  return {
    businessName: 'Abebe Shop',
    amount: 1250,
    phoneMasked: '2519****5678',
    secondsLeft: 90,
    status: 'PENDING',
    ...overrides,
  };
}

function sale(status: SaleStatus): SaleRequestView {
  return {
    requestId: 'req-1',
    status,
    amount: 1250,
    items: [],
    phoneMasked: '2519****5678',
    expiresAt: '2000-01-01T00:00:00.000Z',
    secondsLeft: 0,
    warnings: [],
  };
}

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="here">{`${location.pathname}${location.search}`}</div>;
}

function renderPhone(path = '/customer-sim?requestId=req-1') {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const view = render(
    <QueryClientProvider client={client}>
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={[path]}>
          <CustomerSimPage />
          <LocationProbe />
        </MemoryRouter>
      </I18nextProvider>
    </QueryClientProvider>,
  );
  return { client, ...view };
}

function cacheText(client: QueryClient): string {
  return JSON.stringify({
    queries: client
      .getQueryCache()
      .getAll()
      .map((query) => ({
        key: query.queryKey,
        data: query.state.data,
      })),
    mutations: client
      .getMutationCache()
      .getAll()
      .map((mutation) => ({
        variables: mutation.state.variables,
        data: mutation.state.data,
      })),
  });
}

async function enterPin(user: ReturnType<typeof userEvent.setup>, pin: string) {
  await screen.findByRole('button', { name: '1' });
  for (const digit of pin) {
    await user.click(screen.getByRole('button', { name: digit }));
  }
}

describe('customer phone', () => {
  beforeEach(() => {
    getMockPendingMock.mockReset();
    submitMockPinMock.mockReset();
    getMockPendingMock.mockResolvedValue(pending());
    submitMockPinMock.mockResolvedValue(sale('PAID'));
  });

  it('asks for a request id when the link has none', async () => {
    const user = userEvent.setup();
    renderPhone('/customer-sim');
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Open' }));
    expect(screen.getByText('Paste the payment request.')).toBeInTheDocument();
    await user.type(screen.getByRole('textbox', { name: /^Payment request/ }), 'req-9');
    await user.click(screen.getByRole('button', { name: 'Open' }));
    expect(await screen.findByText(/Abebe Shop requests 1,250 ETB/)).toBeInTheDocument();
    expect(getMockPendingMock).toHaveBeenCalledWith('req-9');
  });

  it('types a PIN from the pad and the keyboard, including backspace', async () => {
    const user = userEvent.setup();
    renderPhone();
    expect(await screen.findByText('2519****5678')).toBeInTheDocument();
    expect(screen.getByText(/\d+s left/)).toBeInTheDocument();
    expect(
      screen.getByText('Any 4 digits = paid, 0000 = wrong PIN, 9999 = insufficient funds'),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '1' }));
    await user.click(screen.getByRole('button', { name: '2' }));
    expect(screen.getByText('Entered 2')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(screen.getByText('Entered 1')).toBeInTheDocument();

    const field = screen.getByLabelText('M-PESA PIN');
    await user.type(field, '{Backspace}89');
    expect(field).toHaveValue('89');
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeDisabled();
  });

  it('submits only a 4-digit PIN', async () => {
    const user = userEvent.setup();
    renderPhone();
    const field = await screen.findByLabelText('M-PESA PIN');
    await user.type(field, '12345');
    expect(field).toHaveValue('1234');
    await user.clear(field);
    await user.type(field, '123');
    await user.keyboard('{Enter}');
    expect(submitMockPinMock).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeDisabled();
    await user.type(field, '4');
    await user.keyboard('{Enter}');
    expect(submitMockPinMock).toHaveBeenCalledTimes(1);
    expect(submitMockPinMock).toHaveBeenCalledWith('req-1', '1234');
  });

  it('clears the PIN as soon as it is sent and keeps it out of the cache', async () => {
    const user = userEvent.setup();
    let release: (value: SaleRequestView) => void = () => undefined;
    submitMockPinMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          release = resolve;
        }),
    );
    const spies = (['log', 'info', 'warn', 'error', 'debug'] as const).map((method) =>
      vi.spyOn(console, method).mockImplementation(() => undefined),
    );
    const { client } = renderPhone();
    await enterPin(user, '4826');
    await user.click(screen.getByRole('button', { name: 'Confirm' }));

    expect(screen.getByLabelText('M-PESA PIN')).toHaveValue('');
    expect(document.body.innerHTML).not.toContain('4826');
    expect(cacheText(client)).not.toContain('4826');
    expect(screen.getByTestId('here')).not.toHaveTextContent('4826');
    expect(submitMockPinMock).toHaveBeenCalledWith('req-1', '4826');

    release(sale('PAID'));
    expect(await screen.findByRole('heading', { name: 'Payment received' })).toBeInTheDocument();
    expect(screen.queryByLabelText('M-PESA PIN')).not.toBeInTheDocument();
    expect(cacheText(client)).not.toContain('4826');
    for (const spy of spies) {
      const text = spy.mock.calls
        .map((args) =>
          args.map((part) => (typeof part === 'string' ? part : JSON.stringify(part))).join(' '),
        )
        .join('\n');
      expect(text).not.toContain('4826');
      spy.mockRestore();
    }
  });

  it('shows each PIN outcome', async () => {
    const user = userEvent.setup();
    submitMockPinMock.mockResolvedValueOnce(sale('DECLINED'));
    renderPhone();
    await enterPin(user, '4826');
    await user.click(await screen.findByRole('button', { name: 'Confirm' }));
    expect(await screen.findByRole('heading', { name: 'Wrong PIN' })).toBeInTheDocument();
    expect(screen.queryByLabelText('M-PESA PIN')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(screen.getByLabelText('M-PESA PIN')).toHaveValue('');

    submitMockPinMock.mockResolvedValueOnce(sale('INSUFFICIENT'));
    await enterPin(user, '4827');
    await user.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(await screen.findByRole('heading', { name: 'Not enough balance' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
  });

  it('shows a final status without asking for a PIN', async () => {
    getMockPendingMock.mockResolvedValue(pending({ status: 'CANCELLED' }));
    renderPhone();
    expect(await screen.findByRole('heading', { name: 'Payment cancelled' })).toBeInTheDocument();
    expect(screen.queryByLabelText('M-PESA PIN')).not.toBeInTheDocument();
  });

  it('explains a missing simulator, an unknown request, a rate limit, and a network retry', async () => {
    const user = userEvent.setup();
    getMockPendingMock.mockRejectedValueOnce(
      new ApiError({ code: 'INTERNAL', message: 'Not Found', status: 404 }),
    );
    renderPhone();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Simulator unavailable - the backend is not in demo mode',
    );

    getMockPendingMock.mockRejectedValueOnce(
      new ApiError({ code: 'NOT_FOUND', message: 'Sale request expired', status: 404 }),
    );
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'This payment request was not found or has expired.',
    );

    getMockPendingMock.mockRejectedValueOnce(
      new ApiError({ code: 'RATE_LIMITED', message: 'Slow', status: 429 }),
    );
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Too many attempts, wait a moment');

    getMockPendingMock.mockRejectedValueOnce(
      new ApiError({ code: 'NETWORK_ERROR', message: 'down', status: 0 }),
    );
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Cannot reach the server.');
    getMockPendingMock.mockResolvedValueOnce(pending());
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText(/Abebe Shop requests 1,250 ETB/)).toBeInTheDocument();
  });
});
