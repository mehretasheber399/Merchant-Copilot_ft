import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it } from 'vitest';
import i18n from '../../i18n';
import { PaymentModeBadge } from './PaymentModeBadge';

describe('PaymentModeBadge', () => {
  it('renders LIVE label from sale.gateway mpesa with text not colour alone', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <PaymentModeBadge mode="mpesa" />
      </I18nextProvider>,
    );
    expect(screen.getByRole('status')).toHaveTextContent('LIVE M-PESA SANDBOX');
  });

  it('renders SIMULATED label from sale.gateway mock', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <PaymentModeBadge mode="mock" />
      </I18nextProvider>,
    );
    expect(screen.getByRole('status')).toHaveTextContent('SIMULATED');
  });

  it('renders nothing when gateway is missing', () => {
    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <PaymentModeBadge mode={undefined} />
      </I18nextProvider>,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
