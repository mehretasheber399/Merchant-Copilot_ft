import {
  keepPreviousData,
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import {
  getDashboard,
  getDashboardHours,
  getStock,
  getTopProducts,
  listTransactions,
} from '../../api/endpoints';
import { useHost } from '../../host/host';
import { useOnline } from '../../hooks/useOnline';
import i18n from '../../i18n';
import type { DashboardRange } from '../../shared/types';
import { useLocaleStore } from '../../store/locale';
import { subscribe } from '../../stream/stream';
import { formatMoney } from '../../utils/format';
import { isPaidSale, isStockLow, mergeTransactions } from './logic';

const STALE_MS = 10_000;

export function useDashboardScreen() {
  const online = useOnline();
  const client = useQueryClient();
  const host = useHost();
  const [range, setRange] = useState<DashboardRange>('today');
  const [flashIds, setFlashIds] = useState<string[]>([]);
  const armFlash = useRef(false);
  const seen = useRef(new Set<string>());
  const seeded = useRef(false);

  const dashboard = useQuery({
    queryKey: ['dashboard', range],
    queryFn: () => getDashboard(range),
    enabled: online,
    staleTime: STALE_MS,
    refetchIntervalInBackground: false,
    placeholderData: keepPreviousData,
  });
  const hours = useQuery({
    queryKey: ['hours', range],
    queryFn: () => getDashboardHours(range),
    enabled: online,
    staleTime: STALE_MS,
    refetchIntervalInBackground: false,
    placeholderData: keepPreviousData,
  });
  const products = useQuery({
    queryKey: ['top-products', range],
    queryFn: () => getTopProducts(range, 10),
    enabled: online,
    staleTime: STALE_MS,
    refetchIntervalInBackground: false,
    placeholderData: keepPreviousData,
  });
  const stock = useQuery({
    queryKey: ['stock'],
    queryFn: getStock,
    enabled: online,
    staleTime: STALE_MS,
    refetchIntervalInBackground: false,
    placeholderData: keepPreviousData,
  });
  const feed = useInfiniteQuery({
    queryKey: ['transactions'],
    queryFn: ({ pageParam }) =>
      listTransactions(pageParam ? { limit: 20, cursor: pageParam } : { limit: 20 }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled: online,
    staleTime: STALE_MS,
    refetchIntervalInBackground: false,
  });

  const rows = mergeTransactions(feed.data?.pages ?? []);
  const rowKey = rows.map((row) => row.id).join('|');

  useEffect(() => {
    const ids = rowKey ? rowKey.split('|') : [];
    if (!seeded.current) {
      ids.forEach((id) => seen.current.add(id));
      seeded.current = true;
      return;
    }
    if (!armFlash.current) {
      ids.forEach((id) => seen.current.add(id));
      return;
    }
    const fresh = ids.filter((id) => !seen.current.has(id));
    ids.forEach((id) => seen.current.add(id));
    armFlash.current = false;
    if (fresh.length === 0) {
      return;
    }
    setFlashIds(fresh);
    const timer = window.setTimeout(() => setFlashIds([]), 2500);
    return () => window.clearTimeout(timer);
  }, [rowKey]);

  useEffect(() => {
    const invalidateShop = () => {
      void client.invalidateQueries({ queryKey: ['dashboard'] });
      void client.invalidateQueries({ queryKey: ['hours'] });
      void client.invalidateQueries({ queryKey: ['top-products'] });
      void client.invalidateQueries({ queryKey: ['stock'] });
      void client.invalidateQueries({ queryKey: ['transactions'] });
    };
    const stopSale = subscribe('sale.updated', (data) => {
      if (!isPaidSale(data)) {
        return;
      }
      invalidateShop();
      armFlash.current = true;
      const amount = formatMoney(data.amount, useLocaleStore.getState().locale);
      host.toast(i18n.t('dashboard:newSale', { amount }), 'success');
    });
    const stopStock = subscribe('stock.low', (data) => {
      if (!isStockLow(data)) {
        return;
      }
      invalidateShop();
      host.toast(i18n.t('dashboard:lowStock', { name: data.name }), 'warning');
    });
    const stopInsight = subscribe('insight.updated', () => {
      void client.invalidateQueries({ queryKey: ['insights'] });
    });
    return () => {
      stopSale();
      stopStock();
      stopInsight();
    };
  }, [client, host]);

  return {
    online,
    range,
    setRange,
    dashboard,
    hours,
    products,
    stock,
    feed,
    rows,
    flashIds,
  };
}
