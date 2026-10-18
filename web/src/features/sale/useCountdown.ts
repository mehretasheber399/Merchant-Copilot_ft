import { useEffect, useRef, useState } from 'react';
import { remainingSeconds } from './logic';

export function useCountdown(requestId: string, secondsLeft: number): number {
  const anchor = useRef({ requestId, secondsLeft, startedAt: Date.now() });
  if (anchor.current.requestId !== requestId) {
    anchor.current = { requestId, secondsLeft, startedAt: Date.now() };
  }
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return remainingSeconds(anchor.current.secondsLeft, anchor.current.startedAt, now);
}
