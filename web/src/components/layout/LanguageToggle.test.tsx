import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it } from 'vitest';
import i18n from '../../i18n';
import { useLocaleStore } from '../../store/locale';
import { LanguageToggle } from './LanguageToggle';

describe('language toggle', () => {
  it('switches to Amharic and persists the choice', async () => {
    useLocaleStore.setState({ locale: 'en' });
    render(
      <I18nextProvider i18n={i18n}>
        <LanguageToggle />
      </I18nextProvider>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'አማ' }));

    expect(screen.getByRole('button', { name: 'አማ' })).toHaveAttribute('aria-pressed', 'true');
    expect(i18n.language).toBe('am');
    const stored = localStorage.getItem('mpesa-copilot-locale');
    expect(stored).toBeTruthy();
    expect(JSON.parse(stored ?? '{}')).toMatchObject({ state: { locale: 'am' } });
  });
});
