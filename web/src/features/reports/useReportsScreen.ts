import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { exportReport, getReportSummary } from '../../api/endpoints';
import { useOnline } from '../../hooks/useOnline';
import i18n from '../../i18n';
import type { DashboardRange } from '../../shared/types';
import { chosenFilename, datedReportName, saveBlob } from '../../utils/download';

const STALE_MS = 10_000;

export function useReportsScreen() {
  const online = useOnline();
  const client = useQueryClient();
  const [range, setRange] = useState<DashboardRange>('today');
  const [downloadError, setDownloadError] = useState(false);
  const [downloading, setDownloading] = useState<'csv' | 'pdf' | null>(null);

  const report = useQuery({
    queryKey: ['reports', range],
    queryFn: () => getReportSummary(range),
    enabled: online,
    staleTime: STALE_MS,
    refetchIntervalInBackground: false,
  });

  const download = useMutation({
    mutationFn: async (format: 'csv' | 'pdf') => {
      setDownloading(format);
      setDownloadError(false);
      const file = await exportReport(range, format);
      saveBlob(file.blob, chosenFilename(file.filename, datedReportName(range, format)));
    },
    onError: () => {
      setDownloadError(true);
    },
    onSettled: () => {
      setDownloading(null);
    },
  });

  return {
    online,
    range,
    setRange,
    report,
    downloading,
    downloadError,
    download: (format: 'csv' | 'pdf') => download.mutate(format),
    retry: () => {
      void client.invalidateQueries({ queryKey: ['reports', range] });
      void report.refetch();
    },
    errorText: i18n.t('reports:downloadError'),
  };
}
