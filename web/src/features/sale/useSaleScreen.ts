import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { cancelSale, requestSale } from '../../api/endpoints';
import { useLiveSale } from '../../hooks/useLiveSale';
import { useOnline } from '../../hooks/useOnline';
import { useProductList } from '../../hooks/useProducts';
import { useCartStore } from '../../store/cart';
import { classifySaleError, isNetworkFailure, type SaleFailure } from './errors';
import { beginAttempt, finishAttempt, isValidPhone, type SaleAttempt } from './logic';
import {
  clearActiveSale,
  readActiveSaleId,
  readPaidAt,
  rememberPaidAt,
  rememberSale,
} from './session';

export function useSaleScreen() {
  const online = useOnline();
  const products = useProductList('');
  const lines = useCartStore((state) => state.lines);
  const limitReached = useCartStore((state) => state.limitReached);
  const add = useCartStore((state) => state.add);
  const change = useCartStore((state) => state.change);
  const clearCart = useCartStore((state) => state.clear);
  const client = useQueryClient();
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState(false);
  const [failure, setFailure] = useState<SaleFailure | null>(null);
  const [cancelFailure, setCancelFailure] = useState<SaleFailure | null>(null);
  const [requestId, setRequestId] = useState<string | null>(() => readActiveSaleId());
  const [paidAt, setPaidAt] = useState<string | null>(() => {
    const id = readActiveSaleId();
    return id ? readPaidAt(id) : null;
  });
  const attempt = useRef<SaleAttempt>({ key: null, reuse: false });
  const invalidated = useRef<string | null>(null);
  const saleQuery = useLiveSale(requestId);
  const sale = saleQuery.data ?? null;

  const request = useMutation({
    mutationFn: (input: {
      phone: string;
      items: { productId: string; qty: number }[];
      key: string;
    }) => requestSale({ phone: input.phone, items: input.items }, input.key),
  });
  const cancel = useMutation({ mutationFn: (id: string) => cancelSale(id) });

  useEffect(() => {
    if (!sale || sale.status !== 'PAID') {
      return;
    }
    const existing = readPaidAt(sale.requestId);
    const stamp = existing ?? new Date().toISOString();
    if (!existing) {
      rememberPaidAt(sale.requestId, stamp);
    }
    setPaidAt(stamp);
    if (invalidated.current === sale.requestId) {
      return;
    }
    invalidated.current = sale.requestId;
    void client.invalidateQueries({ queryKey: ['products'] });
    void client.invalidateQueries({ queryKey: ['dashboard'] });
    void client.invalidateQueries({ queryKey: ['stock'] });
    void client.invalidateQueries({ queryKey: ['transactions'] });
  }, [client, sale]);

  const submit = () => {
    if (lines.length === 0 || request.isPending || sale?.status === 'PENDING') {
      return;
    }
    if (!isValidPhone(phone)) {
      setPhoneError(true);
      return;
    }
    setPhoneError(false);
    setFailure(null);
    const begun = beginAttempt(attempt.current, () => crypto.randomUUID());
    attempt.current = begun.attempt;
    void request
      .mutateAsync({
        phone: phone.trim(),
        items: lines.map((line) => ({ productId: line.productId, qty: line.qty })),
        key: begun.key,
      })
      .then((created) => {
        attempt.current = finishAttempt(attempt.current, 'done');
        rememberSale(created.requestId);
        client.setQueryData(['sale', created.requestId], created);
        setRequestId(created.requestId);
      })
      .catch((error: unknown) => {
        attempt.current = finishAttempt(
          attempt.current,
          isNetworkFailure(error) ? 'network' : 'done',
        );
        setFailure(classifySaleError(error));
      });
  };

  const onCancel = () => {
    if (!requestId || cancel.isPending) {
      return;
    }
    setCancelFailure(null);
    void cancel
      .mutateAsync(requestId)
      .then((updated) => {
        client.setQueryData(['sale', requestId], updated);
      })
      .catch((error: unknown) => {
        setCancelFailure(classifySaleError(error));
        void saleQuery.refetch();
      });
  };

  const newSale = () => {
    clearActiveSale();
    clearCart();
    setRequestId(null);
    setPaidAt(null);
    setFailure(null);
    setCancelFailure(null);
    setPhone('');
    setPhoneError(false);
  };

  return {
    online,
    products,
    lines,
    limitReached,
    add,
    change,
    phone,
    setPhone: (value: string) => {
      setPhone(value);
      if (phoneError) {
        setPhoneError(!isValidPhone(value));
      }
    },
    phoneError,
    blurPhone: () => {
      if (phone.trim().length > 0 && !isValidPhone(phone)) {
        setPhoneError(true);
      }
    },
    failure,
    cancelFailure,
    requestId,
    sale,
    saleQuery,
    paidAt,
    requesting: request.isPending,
    cancelling: cancel.isPending,
    submit,
    onCancel,
    newSale,
  };
}
