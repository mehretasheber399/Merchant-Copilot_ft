import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { getMockPending, submitMockPin } from '../../api/endpoints';
import { useOnline } from '../../hooks/useOnline';
import type { SaleStatus } from '../../shared/types';
import { isFinalStatus, remainingSeconds } from '../sale/logic';
import { classifySimError, type SimFailure } from './errors';
import { canConfirm, popDigit, sanitizePin } from './pin';

export type SimPhase =
  | { phase: 'lookup' }
  | { phase: 'offline' }
  | { phase: 'loading' }
  | { phase: 'loadError'; failure: SimFailure; retry: () => void }
  | { phase: 'final'; status: SaleStatus; retry?: () => void }
  | {
      phase: 'pin';
      businessName: string;
      amount: number;
      phoneMasked: string;
      seconds: number;
      pin: string;
      submitting: boolean;
      expired: boolean;
      failure: SimFailure | null;
      onChange: (value: string) => void;
      onBackspace: () => void;
      onConfirm: () => void;
    };

export function useCustomerSim(requestId: string | null): SimPhase {
  const online = useOnline();
  const pending = useQuery({
    queryKey: ['gateway', 'pending', requestId],
    queryFn: () => getMockPending(requestId as string),
    enabled: Boolean(requestId) && online,
    staleTime: 10_000,
  });
  const [pin, setPin] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SaleStatus | null>(null);
  const [failure, setFailure] = useState<SimFailure | null>(null);
  const sending = useRef(false);
  const seconds = usePromptCountdown(requestId, pending.data?.secondsLeft ?? null);

  useEffect(() => {
    setPin('');
    setResult(null);
    setFailure(null);
    sending.current = false;
  }, [requestId]);

  const retryLoad = () => {
    setFailure(null);
    void pending.refetch();
  };

  if (!requestId) {
    return { phase: 'lookup' };
  }
  if (!online && !pending.data) {
    return { phase: 'offline' };
  }
  if (!pending.data && pending.fetchStatus === 'paused' && pending.failureCount > 0) {
    return {
      phase: 'loadError',
      failure: classifySimError(pending.failureReason),
      retry: retryLoad,
    };
  }
  if (!pending.data && pending.isPending) {
    return { phase: 'loading' };
  }
  if (!pending.data && pending.isError) {
    return { phase: 'loadError', failure: classifySimError(pending.error), retry: retryLoad };
  }
  if (!pending.data) {
    return { phase: 'loading' };
  }

  const retryPin = () => {
    setResult(null);
    setFailure(null);
    setPin('');
  };

  if (result && result !== 'PENDING') {
    return {
      phase: 'final',
      status: result,
      retry: result === 'DECLINED' ? retryPin : undefined,
    };
  }
  if (isFinalStatus(pending.data.status)) {
    return { phase: 'final', status: pending.data.status };
  }

  const expired = seconds <= 0;
  const onConfirm = () => {
    if (sending.current || expired || !canConfirm(pin)) {
      return;
    }
    const entered = pin;
    sending.current = true;
    setPin('');
    setFailure(null);
    setSubmitting(true);
    void submitMockPin(requestId, entered)
      .then((sale) => {
        if (sale.status === 'PENDING') {
          setFailure({ kind: 'generic' });
          return;
        }
        setResult(sale.status);
      })
      .catch((error: unknown) => {
        const problem = classifySimError(error);
        if (problem.kind === 'conflict') {
          void pending.refetch();
        }
        setFailure(problem);
      })
      .finally(() => {
        sending.current = false;
        setSubmitting(false);
      });
  };

  return {
    phase: 'pin',
    businessName: pending.data.businessName,
    amount: pending.data.amount,
    phoneMasked: pending.data.phoneMasked,
    seconds,
    pin,
    submitting,
    expired,
    failure,
    onChange: (value) => setPin(sanitizePin(value)),
    onBackspace: () => setPin((current) => popDigit(current)),
    onConfirm,
  };
}

function usePromptCountdown(requestId: string | null, secondsLeft: number | null): number {
  const anchor = useRef<{ requestId: string; secondsLeft: number; startedAt: number } | null>(null);
  if (requestId && secondsLeft !== null) {
    if (!anchor.current || anchor.current.requestId !== requestId) {
      anchor.current = { requestId, secondsLeft, startedAt: Date.now() };
    }
  } else if (!requestId || anchor.current?.requestId !== requestId) {
    anchor.current = null;
  }
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  if (!anchor.current) {
    return 0;
  }
  return remainingSeconds(anchor.current.secondsLeft, anchor.current.startedAt, now);
}
