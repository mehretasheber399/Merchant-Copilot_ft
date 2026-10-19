import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import i18n from '../../i18n';
import { BottomNav } from './BottomNav';

describe('bottom nav', () => {
  it('links Sale, Items, Dashboard and Insights', async () => {
    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={['/dashboard']}>
          <BottomNav />
        </MemoryRouter>
      </I18nextProvider>,
    );

    expect(screen.getByRole('link', { name: 'Sale' })).toHaveAttribute('href', '/sale');
    expect(screen.getByRole('link', { name: 'Products' })).toHaveAttribute('href', '/items');
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('href', '/dashboard');
    expect(screen.getByRole('link', { name: 'Insights' })).toHaveAttribute('href', '/insights');
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('aria-current', 'page');

    await userEvent.click(screen.getByRole('link', { name: 'Products' }));
    expect(screen.getByRole('link', { name: 'Products' })).toHaveAttribute('aria-current', 'page');
  });
});
