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
import { SettingsPage } from './components/agency/SettingsPage';
import { AuthGuard } from './components/auth/AuthGuard';
import { Login } from './components/auth/Login';
import { ToastContainer, useToast } from './components/Toast';
import { AgencyHeader } from './components/layout/AgencyHeader';
import { ErrorBoundary } from './components/ErrorBoundary';
import { DialogProvider } from './contexts/DialogContext';

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

import { WelcomeModal } from './components/WelcomeModal';
import { safeLocalStorage } from './lib/storage/safeLocalStorage';

export default function App() {
  const toast = useToast();
  const { isAuthenticated, loading, login, logout } = useAuthState();
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      const hasSeen = safeLocalStorage.getItem('hasSeenWelcome');
      if (!hasSeen) {
        setShowWelcome(true);
      }
    }
  }, [isAuthenticated]);

  const handleCloseWelcome = () => {
    safeLocalStorage.setItem('hasSeenWelcome', 'true');
    setShowWelcome(false);
  };

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
      <DialogProvider>
        <ToastContainer toasts={toast.toasts} onDismiss={toast.dismiss} />
        {showWelcome && <WelcomeModal onClose={handleCloseWelcome} />}
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

            {/* Default redirect */}
            <Route
              path='/'
              element={
                <Navigate
                  to={isAuthenticated ? '/agency/workspaces' : '/login'}
                  replace
                />
              }
            />

            {/* Catch all */}
            <Route
              path='*'
              element={
                <Navigate
                  to={isAuthenticated ? '/agency/workspaces' : '/login'}
                  replace
                />
              }
            />
          </Routes>
        </Router>
      </DialogProvider>
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

          {/* Settings */}
          <Route path='/settings' element={<SettingsPage />} />

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
