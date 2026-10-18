import { create } from 'zustand';
import { ApiError } from '../api/client';
import { getMe, streamUrl } from '../api/endpoints';
import { useAuthStore } from '../store/auth';

type Handler = (data: unknown) => void;

const EVENTS = [
  'ready',
  'sale.updated',
  'stock.low',
  'stock.shortfall',
  'insight.updated',
] as const;

interface StreamStatus {
  connected: boolean;
}

export const useStreamStatus = create<StreamStatus>(() => ({ connected: false }));

const handlers = new Map<string, Set<Handler>>();
let refs = 0;
let source: EventSource | null = null;
let openToken: string | null = null;
let closeTimer: number | null = null;
let outageChecked = false;

function setConnected(connected: boolean) {
  if (useStreamStatus.getState().connected !== connected) {
    useStreamStatus.setState({ connected });
  }
}

function dispatch(eventName: string, data: unknown) {
  handlers.get(eventName)?.forEach((handler) => handler(data));
}

function parseEvent(event: Event): unknown {
  const message = event as MessageEvent<string>;
  if (typeof message.data !== 'string') {
    return message.data;
  }
  try {
    return JSON.parse(message.data) as unknown;
  } catch {
    return message.data;
  }
}

function hardClose() {
  if (closeTimer !== null) {
    window.clearTimeout(closeTimer);
    closeTimer = null;
  }
  const current = source;
  source = null;
  openToken = null;
  setConnected(false);
  current?.close();
}

function open(token: string) {
  const es = new EventSource(streamUrl(token));
  source = es;
  openToken = token;
  outageChecked = false;
  for (const name of EVENTS) {
    es.addEventListener(name, (event) => {
      if (name === 'ready') {
        setConnected(true);
        outageChecked = false;
      }
      dispatch(name, parseEvent(event));
    });
  }
  es.onopen = () => {
    setConnected(true);
    outageChecked = false;
  };
  es.onerror = () => {
    if (source !== es) {
      return;
    }
    setConnected(false);
    if (outageChecked || !useAuthStore.getState().token) {
      return;
    }
    outageChecked = true;
    void getMe().catch((error: unknown) => {
      if (error instanceof ApiError && error.status === 401) {
        useAuthStore.getState().clearSession();
      }
    });
  };
}

function sync() {
  const token = useAuthStore.getState().token;
  if (refs <= 0 || !token) {
    if (!source) {
      setConnected(false);
      return;
    }
    if (closeTimer !== null) {
      return;
    }
    closeTimer = window.setTimeout(() => {
      closeTimer = null;
      if (refs <= 0 || !useAuthStore.getState().token) {
        hardClose();
      }
    }, 0);
    return;
  }
  if (closeTimer !== null) {
    window.clearTimeout(closeTimer);
    closeTimer = null;
  }
  if (source && openToken === token) {
    return;
  }
  hardClose();
  open(token);
}

export function retainStream(): () => void {
  refs += 1;
  sync();
  return () => {
    refs = Math.max(0, refs - 1);
    sync();
  };
}

export function subscribe(eventName: string, handler: Handler): () => void {
  let bucket = handlers.get(eventName);
  if (!bucket) {
    bucket = new Set();
    handlers.set(eventName, bucket);
  }
  bucket.add(handler);
  const release = retainStream();
  return () => {
    bucket?.delete(handler);
    release();
  };
}

useAuthStore.subscribe((state, previous) => {
  if (state.token !== previous.token) {
    outageChecked = false;
    sync();
  }
});

export function resetStreamForTests() {
  hardClose();
  refs = 0;
  handlers.clear();
  outageChecked = false;
  useStreamStatus.setState({ connected: false });
}
