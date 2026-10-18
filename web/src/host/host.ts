import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { useToastStore } from '../store/toast';
import type { ToastTone } from '../shared/types';
import { WebHost } from './web-host';

export interface Host {
  navigate: (path: string) => void;
  logout: () => void;
  toast: (message: string, tone?: ToastTone) => void;
  getBusinessName: () => string;
}

export function useHost(): Host {
  const navigate = useNavigate();
  const clearSession = useAuthStore((state) => state.clearSession);
  const businessName = useAuthStore((state) => state.merchant?.businessName ?? '');
  const pushToast = useToastStore((state) => state.push);

  return useMemo(
    () =>
      new WebHost({
        navigate: (path) => navigate(path),
        logout: () => {
          clearSession();
          navigate('/login', { replace: true });
        },
        toast: (message, tone) => pushToast({ message, tone }),
        businessName,
      }),
    [navigate, clearSession, businessName, pushToast],
  );
}

export { WebHost };
