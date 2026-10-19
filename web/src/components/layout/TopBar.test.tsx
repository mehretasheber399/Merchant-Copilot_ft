import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import i18n from '../../i18n';
import { useAuthStore } from '../../store/auth';
import { TopBar } from './TopBar';

function renderBar() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <TopBar />
        </MemoryRouter>
      </I18nextProvider>
    </QueryClientProvider>,
  );
}

describe('menu', () => {
  beforeEach(() => {
    useAuthStore.getState().setSession('tok', { id: 'm1', businessName: 'Shop' });
  });

  it('opens language and log out from the menu', async () => {
    const user = userEvent.setup();
    renderBar();
    expect(screen.queryByRole('button', { name: 'Log out' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Menu' }));
    expect(screen.getByRole('group', { name: 'Language' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Log out' })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Demo' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reset demo data' })).not.toBeInTheDocument();
    expect(useAuthStore.getState().token).toBe('tok');
  });
});
