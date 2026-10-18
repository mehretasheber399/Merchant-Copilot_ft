import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { loginPathFor } from '../../api/client';
import { useAuthStore } from '../../store/auth';

export function RequireAuth({ children }: { children: ReactNode }) {
  const token = useAuthStore((state) => state.token);
  const location = useLocation();
  if (!token) {
    return <Navigate to={loginPathFor(location.pathname, location.search)} replace />;
  }
  return children;
}
