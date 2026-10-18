import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import {
  dismissTransactionMapping,
  getInsightEvidence,
  getInsights,
  listProducts,
  listUnmappedTransactions,
  mapTransaction,
  refreshInsights,
} from '../../api/endpoints';
import { useHost } from '../../host/host';
import { useOnline } from '../../hooks/useOnline';
import i18n from '../../i18n';
import { subscribe } from '../../stream/stream';
import { mappingErrorKey, type PickedLine } from './logic';

const STALE_MS = 10_000;

export function useInsightsScreen() {
  const online = useOnline();
  const client = useQueryClient();
  const host = useHost();
  const [evidenceId, setEvidenceId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const insights = useQuery({
    queryKey: ['insights'],
    queryFn: getInsights,
    enabled: online,
    staleTime: STALE_MS,
    refetchIntervalInBackground: false,
  });
  const unmapped = useQuery({
    queryKey: ['unmapped'],
    queryFn: () => listUnmappedTransactions(20),
    enabled: online,
    staleTime: STALE_MS,
    refetchIntervalInBackground: false,
  });
  const products = useQuery({
    queryKey: ['products', ''],
    queryFn: () => listProducts({ limit: 100, activeOnly: true }),
    enabled: online && editingId !== null,
    staleTime: STALE_MS,
    refetchIntervalInBackground: false,
  });
  const evidence = useQuery({
    queryKey: ['insight-evidence', evidenceId],
    queryFn: () => getInsightEvidence(evidenceId as string),
    enabled: online && Boolean(evidenceId),
    staleTime: STALE_MS,
    refetchIntervalInBackground: false,
  });

  const refresh = useMutation({
    mutationFn: refreshInsights,
    onSuccess: (data) => {
      client.setQueryData(['insights'], data);
    },
  });

  const invalidateMapped = () => {
    void client.invalidateQueries({ queryKey: ['insights'] });
    void client.invalidateQueries({ queryKey: ['stock'] });
    void client.invalidateQueries({ queryKey: ['dashboard'] });
    void client.invalidateQueries({ queryKey: ['transactions'] });
    void client.invalidateQueries({ queryKey: ['unmapped'] });
  };

  const confirm = useMutation({
    mutationFn: (input: { id: string; items: PickedLine[] }) =>
      mapTransaction(input.id, input.items),
    onSuccess: () => {
      setEditingId(null);
      host.toast(i18n.t('insights:mapped'), 'success');
      invalidateMapped();
    },
  });

  const dismiss = useMutation({
    mutationFn: (id: string) => dismissTransactionMapping(id),
    onSuccess: () => {
      host.toast(i18n.t('insights:dismissed'), 'info');
      void client.invalidateQueries({ queryKey: ['unmapped'] });
    },
  });

  useEffect(() => {
    const stopInsight = subscribe('insight.updated', () => {
      void client.invalidateQueries({ queryKey: ['insights'] });
    });
    const stopSale = subscribe('sale.updated', () => {
      void client.invalidateQueries({ queryKey: ['unmapped'] });
    });
    return () => {
      stopInsight();
      stopSale();
    };
  }, [client]);

  return {
    online,
    insights,
    unmapped,
    products,
    evidence,
    evidenceId,
    setEvidenceId,
    editingId,
    setEditingId,
    refresh,
    confirm,
    dismiss,
    confirmErrorKey:
      confirm.isError && confirm.variables
        ? { id: confirm.variables.id, key: mappingErrorKey(confirm.error) }
        : null,
    dismissErrorKey: dismiss.isError ? mappingErrorKey(dismiss.error) : null,
  };
}
