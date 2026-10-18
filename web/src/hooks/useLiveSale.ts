import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { getSale } from '../api/endpoints';
import { applySaleUpdate, pollIntervalMs } from '../features/sale/logic';
import type { SaleRequestView, SaleUpdatedEvent } from '../shared/types';
import { subscribe, useStreamStatus } from '../stream/stream';

export function useLiveSale(requestId: string | null) {
  const connected = useStreamStatus((state) => state.connected);
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ['sale', requestId],
    enabled: Boolean(requestId),
    queryFn: () => getSale(requestId ?? ''),
    refetchInterval: (current) => pollIntervalMs(connected, current.state.data?.status),
    refetchIntervalInBackground: false,
  });

  useEffect(() => {
    if (!requestId) {
      return;
    }
    return subscribe('sale.updated', (data) => {
      const event = data as SaleUpdatedEvent;
      if (event.requestId !== requestId) {
        return;
      }
      client.setQueryData<SaleRequestView>(['sale', requestId], (current) =>
        current ? applySaleUpdate(current, event) : current,
      );
    });
  }, [client, requestId]);

  return query;
}
