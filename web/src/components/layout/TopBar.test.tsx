import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { listProducts, resetDemo } from '../../api/endpoints';
import { ToastViewport } from '../ui/Toast';
import i18n from '../../i18n';
import { useAuthStore } from '../../store/auth';
import { useToastStore } from '../../store/toast';
import { TopBar } from './TopBar';

vi.mock('../../api/endpoints', async () => {
  const actual = await vi.importActual<typeof import('../../api/endpoints')>('../../api/endpoints');
  return {
    ...actual,
    listProducts: vi.fn(),
    resetDemo: vi.fn(),
    simulateSale: vi.fn(),
    simulateDirectPayment: vi.fn(),
    drainStock: vi.fn(),
  };
});

const listProductsMock = vi.mocked(listProducts);
const resetDemoMock = vi.mocked(resetDemo);

function renderBar() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const clear = vi.spyOn(client, 'clear');
  render(
    <QueryClientProvider client={client}>
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <TopBar />
          <ToastViewport />
        </MemoryRouter>
      </I18nextProvider>
    </QueryClientProvider>,
  );
  return { clear };
}

describe('menu demo reset', () => {
  beforeEach(() => {
    useToastStore.setState({ toasts: [] });
    useAuthStore.getState().setSession('tok', { id: 'm1', businessName: 'Shop' });
    listProductsMock.mockReset();
    resetDemoMock.mockReset();
    listProductsMock.mockResolvedValue([]);
    resetDemoMock.mockResolvedValue({
      merchantId: 'm1',
      products: 4,
      transactions: 2,
      todayTotal: 1000,
    });
  });

  it('refetches every query and keeps the session', async () => {
    const user = userEvent.setup();
    const { clear } = renderBar();
    await user.click(screen.getByRole('button', { name: 'Menu' }));
    expect(screen.getByRole('link', { name: 'Reports' })).toHaveAttribute('href', '/reports');
    await user.click(screen.getByRole('button', { name: 'Reset demo data' }));
    await user.click(screen.getByRole('button', { name: 'Reset now' }));
    expect(await screen.findByText('Demo data reset. Today 1,000 ETB')).toBeInTheDocument();
    expect(resetDemoMock).toHaveBeenCalledOnce();
    expect(clear).toHaveBeenCalledOnce();
    expect(useAuthStore.getState().token).toBe('tok');
  });
});
