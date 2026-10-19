import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '../api/client';
import { getGatewayMode, setGatewayMode } from '../api/endpoints';
import { config } from '../config';
import { useOnline } from './useOnline';
import type { GatewayMode, GatewayModeState, GatewayModeView } from '../shared/types';

export const GATEWAY_MODE_QUERY_KEY = ['demo', 'gateway'] as const;

export interface GatewayModeQueryData {
  mode: GatewayModeState;
  switchable: boolean;
}

function asQueryData(view: GatewayModeView): GatewayModeQueryData {
  return { mode: view.mode, switchable: view.switchable };
}

async function fetchGatewayMode(): Promise<GatewayModeQueryData> {
  try {
    return asQueryData(await getGatewayMode());
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return { mode: 'unknown', switchable: false };
    }
    throw error;
  }
}

export function useGatewayMode(enabled = true) {
  const online = useOnline();
  const client = useQueryClient();
  const query = useQuery({
    queryKey: GATEWAY_MODE_QUERY_KEY,
    queryFn: fetchGatewayMode,
    enabled: enabled && config.demoTools && online,
    staleTime: 10_000,
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: false,
  });

  const switchMode = useMutation({
    mutationFn: (mode: GatewayMode) => setGatewayMode(mode),
    onSuccess: (result) => {
      client.setQueryData(GATEWAY_MODE_QUERY_KEY, asQueryData(result));
    },
  });

  return {
    mode: query.data?.mode ?? 'unknown',
    switchable: query.data?.switchable === true,
    isPending: query.isPending,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    switchMode,
  };
}
