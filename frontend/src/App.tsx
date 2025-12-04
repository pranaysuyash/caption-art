import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { WorkspaceList } from './components/agency/WorkspaceList';
import { CampaignList } from './components/agency/CampaignList';
import { CampaignDetail } from './components/agency/CampaignDetail';
import { ReviewGrid } from './components/agency/ReviewGrid';
import { AuthGuard } from './components/auth/AuthGuard';
import { Login } from './components/auth/Login';
import { Playground } from './components/playground/Playground';
import { ToastContainer, useToast } from './components/Toast';
import { AgencyHeader } from './components/layout/AgencyHeader';
import { ErrorBoundary } from './components/ErrorBoundary';

import apiFetch from './lib/api/httpClient';

function useAuthState() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

  const checkSession = useCallback(async () => {
    try {
      const res = await apiFetch(`${apiBase}/api/auth/me`, { method: 'GET' });
      setIsAuthenticated(res.ok);
    } catch {
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const login = async () => {
    await checkSession();
  };

  const logout = () => {
    apiFetch(`${apiBase}/api/auth/logout`, { method: 'POST' }).catch(() => {});
    setIsAuthenticated(false);
  };

  return { isAuthenticated, loading, login, logout };
}

export default function App() {
  const toast = useToast();
  const { isAuthenticated, loading, login, logout } = useAuthState();

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          fontFamily: 'var(--font-body, sans-serif)',
        }}
      >
        Loading...
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <ToastContainer toasts={toast.toasts} onDismiss={toast.dismiss} />
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path='/login' element={<Login onLogin={login} />} />

          {/* Protected agency routes */}
          <Route
            path='/agency/*'
            element={
              <AuthGuard isAuthenticated={isAuthenticated} loading={loading}>
                <AgencyRoutes onLogout={logout} />
              </AuthGuard>
            }
          />

          {/* Legacy playground - moved from root */}
          <Route 
            path='/playground' 
            element={
              <ErrorBoundary>
                <Playground />
              </ErrorBoundary>
            } 
          />

          {/* Default redirect */}
          <Route
            path='/'
            element={
              <Navigate
                to={isAuthenticated ? '/agency/workspaces' : '/playground'}
                replace
              />
            }
          />

          {/* Catch all */}
          <Route
            path='*'
            element={
              <Navigate
                to={isAuthenticated ? '/agency/workspaces' : '/playground'}
                replace
              />
            }
          />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

function AgencyRoutes({ onLogout }: { onLogout: () => void }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'var(--font-body, sans-serif)',
      }}
    >
      <AgencyHeader onLogout={onLogout} />

      <main style={{ flex: 1 }}>
        <Routes>
          {/* Workspace management */}
          <Route path='/workspaces' element={<WorkspaceList />} />
          <Route
            path='/workspaces/:workspaceId/campaigns'
            element={<CampaignList />}
          />

          {/* Campaign management */}
          <Route
            path='/workspaces/:workspaceId/campaigns/:campaignId'
            element={<CampaignDetail />}
          />

          {/* Review and export */}
          <Route
            path='/workspaces/:workspaceId/campaigns/:campaignId/review'
            element={<ReviewGrid />}
          />

          {/* Default agency route */}
          <Route
            path='/'
            element={<Navigate to='/agency/workspaces' replace />}
          />
          <Route
            path='*'
            element={<Navigate to='/agency/workspaces' replace />}
          />
        </Routes>
      </main>
    </div>
  );
}
