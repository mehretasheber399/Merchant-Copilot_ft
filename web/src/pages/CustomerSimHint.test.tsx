import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getMockPending } from '../api/endpoints';
import i18n from '../i18n';
import type { MockPending } from '../shared/types';
import { CustomerSimPage } from './CustomerSimPage';

vi.mock('../config', () => ({
  config: { apiBaseUrl: 'http://127.0.0.1:3000', demoTools: false },
  REQUEST_TIMEOUT_MS: 15_000,
}));

vi.mock('../api/endpoints', async () => {
  const actual = await vi.importActual<typeof import('../api/endpoints')>('../api/endpoints');
  return { ...actual, getMockPending: vi.fn(), submitMockPin: vi.fn() };
});

const getMockPendingMock = vi.mocked(getMockPending);

function pending(): MockPending {
  return {
    businessName: 'Abebe Shop',
    amount: 1250,
    phoneMasked: '2519****5678',
    secondsLeft: 90,
    status: 'PENDING',
  };
}

describe('customer phone without demo tools', () => {
  beforeEach(() => {
    getMockPendingMock.mockReset();
    getMockPendingMock.mockResolvedValue(pending());
  });

  it('hides the tester hint', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <I18nextProvider i18n={i18n}>
          <MemoryRouter initialEntries={['/customer-sim?requestId=req-1']}>
            <CustomerSimPage />
          </MemoryRouter>
        </I18nextProvider>
      </QueryClientProvider>,
    );
    expect(await screen.findByText(/Abebe Shop requests 1,250 ETB/)).toBeInTheDocument();
    expect(
      screen.queryByText('Any 4 digits = paid, 0000 = wrong PIN, 9999 = insufficient funds'),
    ).not.toBeInTheDocument();
  });
});
