import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useSearchParams } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { useAuthStore } from '../../store/auth';
import { RequireAuth } from './RequireAuth';

function LoginProbe() {
  const [params] = useSearchParams();
  return <div>return:{params.get('returnTo')}</div>;
}

describe('RequireAuth', () => {
  it('sends anonymous users to login and keeps the return path', () => {
    useAuthStore.getState().clearSession();
    render(
      <MemoryRouter initialEntries={['/items?q=1']}>
        <Routes>
          <Route path="/login" element={<LoginProbe />} />
          <Route
            path="/items"
            element={
              <RequireAuth>
                <div>Items</div>
              </RequireAuth>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('return:/items?q=1')).toBeInTheDocument();
    expect(screen.queryByText('Items')).not.toBeInTheDocument();
  });

  it('renders the screen when a session exists', () => {
    useAuthStore.getState().setSession('tok', { id: 'm1', businessName: 'Shop' });
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/login" element={<div>Login</div>} />
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <div>Secret</div>
              </RequireAuth>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Secret')).toBeInTheDocument();
  });
});
