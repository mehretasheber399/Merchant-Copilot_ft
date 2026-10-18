import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../api/client';
import { exportReport, getReportSummary } from '../api/endpoints';
import i18n from '../i18n';
import { ReportsPage } from './ReportsPage';

vi.mock('../api/endpoints', async () => {
  const actual = await vi.importActual<typeof import('../api/endpoints')>('../api/endpoints');
  return {
    ...actual,
    getReportSummary: vi.fn(),
    exportReport: vi.fn(),
  };
});

const getReportSummaryMock = vi.mocked(getReportSummary);
const exportReportMock = vi.mocked(exportReport);

function renderReports() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <I18nextProvider i18n={i18n}>
        <ReportsPage />
      </I18nextProvider>
    </QueryClientProvider>,
  );
}

describe('reports', () => {
  beforeEach(() => {
    getReportSummaryMock.mockReset();
    exportReportMock.mockReset();
    getReportSummaryMock.mockRejectedValue(
      new ApiError({ code: 'NETWORK_ERROR', message: 'offline', status: 0 }),
    );
    exportReportMock.mockRejectedValue(
      new ApiError({ code: 'INTERNAL', message: 'no', status: 500 }),
    );
  });

  it('shows a retryable error and a download failure', async () => {
    const user = userEvent.setup();
    renderReports();
    expect(await screen.findByRole('alert')).toHaveTextContent('Cannot reach the server.');
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(() => {
      expect(getReportSummaryMock.mock.calls.length).toBeGreaterThan(1);
    });
    await user.click(screen.getByRole('button', { name: 'Download CSV' }));
    expect(await screen.findByText('Download failed. Try again.')).toBeInTheDocument();
  });
});
