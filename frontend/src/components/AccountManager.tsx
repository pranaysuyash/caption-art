/**
 * Account Manager Component
 * Displays and manages connected social media accounts
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

import { useState, useEffect } from 'react';
import { oauthHandler } from '../lib/social/oauthHandler';
import { platformManager } from '../lib/social/platformManager';
import { useConfirm } from '../contexts/DialogContext';
import type { ShareablePlatform, AuthStatus } from '../lib/social/types';

export interface AccountManagerProps {
  onAccountConnected?: (platform: ShareablePlatform) => void;
  onAccountDisconnected?: (platform: ShareablePlatform) => void;
}

export function AccountManager({
  onAccountConnected,
  onAccountDisconnected,
}: AccountManagerProps) {
  const [accounts, setAccounts] = useState<AuthStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectingPlatform, setConnectingPlatform] = useState<ShareablePlatform | null>(
    null
  );
  const confirm = useConfirm();

  const platforms: ShareablePlatform[] = ['instagram', 'twitter', 'facebook', 'pinterest'];

  // Load account statuses on mount
  useEffect(() => {
    loadAccounts();
  }, []);

  /**
   * Load authentication status for all platforms
   * Requirements: 6.1
   */
  const loadAccounts = async () => {
    setLoading(true);
    try {
      const statuses = await Promise.all(
        platforms.map((platform) => platformManager.checkAuthStatus(platform))
      );
      setAccounts(statuses);
    } catch (error) {
      console.error('Failed to load accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Connect a new account
   * Requirements: 6.3
   */
  const handleConnect = async (platform: ShareablePlatform) => {
    try {
      setConnectingPlatform(platform);
      oauthHandler.initiateOAuthFlow(platform);

      // Listen for OAuth callback
      const handleMessage = async (event: MessageEvent) => {
        if (event.data.type === 'oauth_success' && event.data.platform === platform) {
          window.removeEventListener('message', handleMessage);
          await loadAccounts();
          setConnectingPlatform(null);
          onAccountConnected?.(platform);
        }
      };

      window.addEventListener('message', handleMessage);

      // Timeout after 5 minutes
      setTimeout(() => {
        window.removeEventListener('message', handleMessage);
        setConnectingPlatform(null);
      }, 5 * 60 * 1000);
    } catch (error) {
      console.error(`Failed to connect ${platform}:`, error);
      setConnectingPlatform(null);
    }
  };

  /**
   * Disconnect an account
   * Requirements: 6.2
   */
  const handleDisconnect = async (platform: ShareablePlatform) => {
    const confirmed = await confirm({
      title: 'Disconnect Account',
      message: `Are you sure you want to disconnect your ${platform} account?`,
      confirmLabel: 'Disconnect',
      variant: 'warning',
    });
    
    if (!confirmed) {
      return;
    }

    try {
      await oauthHandler.revokeToken(platform);
      await loadAccounts();
      onAccountDisconnected?.(platform);
    } catch (error) {
      console.error(`Failed to disconnect ${platform}:`, error);
    }
  };

  /**
   * Handle token expiration
   * Requirements: 6.5
   */
  const handleReauthenticate = async (platform: ShareablePlatform) => {
    await handleConnect(platform);
  };

  /**
   * Check if token is expired or expiring soon (within 24 hours)
   */
  const isTokenExpiring = (account: AuthStatus): boolean => {
    if (!account.tokenExpiry) return false;
    const expiryTime = new Date(account.tokenExpiry).getTime();
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    return expiryTime - now < twentyFourHours;
  };

  /**
   * Get platform display name
   */
  const getPlatformDisplayName = (platform: ShareablePlatform): string => {
    const config = platformManager.getPlatformConfig(platform);
    return config.displayName;
  };

  /**
   * Get platform icon
   */
  const getPlatformIcon = (platform: ShareablePlatform): string => {
    const icons: Record<ShareablePlatform, string> = {
      instagram: '📷',
      twitter: '🐦',
      facebook: '👥',
      pinterest: '📌',
    };
    return icons[platform];
  };

  if (loading) {
    return (
      <div className="account-manager">
        <div className="account-manager-header">
          <h2>Connected Accounts</h2>
        </div>
        <div className="account-manager-loading">Loading accounts...</div>
      </div>
    );
  }

  return (
    <div className="account-manager">
      <div className="account-manager-header">
        <h2>Connected Accounts</h2>
        <p>Manage your social media connections</p>
      </div>

      <div className="account-list">
        {accounts.map((account) => (
          <div
            key={account.platform}
            className={`account-card ${account.isAuthenticated ? 'connected' : 'disconnected'}`}
          >
            <div className="account-icon">{getPlatformIcon(account.platform)}</div>

            <div className="account-info">
              <div className="account-platform">
                {getPlatformDisplayName(account.platform)}
              </div>

              {account.isAuthenticated ? (
                <>
                  {/* Requirements: 6.4 - Show account details */}
                  <div className="account-details">
                    {account.profilePicture && (
                      <img
                        src={account.profilePicture}
                        alt={account.username}
                        className="account-avatar"
                      />
                    )}
                    <span className="account-username">@{account.username}</span>
                  </div>

                  {/* Requirements: 6.5 - Handle token expiration */}
                  {isTokenExpiring(account) && (
                    <div className="account-warning">
                      ⚠️ Token expiring soon - please reconnect
                    </div>
                  )}

                  {account.tokenExpiry && (
                    <div className="account-expiry">
                      Expires: {new Date(account.tokenExpiry).toLocaleDateString()}
                    </div>
                  )}
                </>
              ) : (
                <div className="account-status">Not connected</div>
              )}
            </div>

            <div className="account-actions">
              {account.isAuthenticated ? (
                <>
                  {isTokenExpiring(account) && (
                    <button
                      className="btn-reconnect"
                      onClick={() => handleReauthenticate(account.platform)}
                      disabled={connectingPlatform === account.platform}
                    >
                      {connectingPlatform === account.platform
                        ? 'Connecting...'
                        : 'Reconnect'}
                    </button>
                  )}
                  <button
                    className="btn-disconnect"
                    onClick={() => handleDisconnect(account.platform)}
                  >
                    Disconnect
                  </button>
                </>
              ) : (
                <button
                  className="btn-connect"
                  onClick={() => handleConnect(account.platform)}
                  disabled={connectingPlatform === account.platform}
                >
                  {connectingPlatform === account.platform ? 'Connecting...' : 'Connect'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .account-manager {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
        }

        .account-manager-header {
          margin-bottom: 2rem;
        }

        .account-manager-header h2 {
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }

        .account-manager-header p {
          color: #666;
          font-size: 0.875rem;
        }

        .account-manager-loading {
          text-align: center;
          padding: 2rem;
          color: #666;
        }

        .account-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .account-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.5rem;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          background: white;
          transition: all 0.2s;
        }

        .account-card.connected {
          border-color: #10b981;
          background: #f0fdf4;
        }

        .account-card.disconnected {
          border-color: #e5e7eb;
          background: #f9fafb;
        }

        .account-icon {
          font-size: 2rem;
          width: 3rem;
          height: 3rem;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
          border-radius: 50%;
          border: 2px solid #e5e7eb;
        }

        .account-info {
          flex: 1;
          min-width: 0;
        }

        .account-platform {
          font-weight: 600;
          font-size: 1.125rem;
          margin-bottom: 0.25rem;
        }

        .account-details {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }

        .account-avatar {
          width: 2rem;
          height: 2rem;
          border-radius: 50%;
          object-fit: cover;
        }

        .account-username {
          color: #374151;
          font-size: 0.875rem;
        }

        .account-status {
          color: #6b7280;
          font-size: 0.875rem;
        }

        .account-warning {
          margin-top: 0.5rem;
          padding: 0.5rem;
          background: #fef3c7;
          border: 1px solid #fbbf24;
          border-radius: 4px;
          font-size: 0.75rem;
          color: #92400e;
        }

        .account-expiry {
          margin-top: 0.25rem;
          font-size: 0.75rem;
          color: #6b7280;
        }

        .account-actions {
          display: flex;
          gap: 0.5rem;
        }

        .btn-connect,
        .btn-disconnect,
        .btn-reconnect {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-connect {
          background: #3b82f6;
          color: white;
        }

        .btn-connect:hover:not(:disabled) {
          background: #2563eb;
        }

        .btn-reconnect {
          background: #f59e0b;
          color: white;
        }

        .btn-reconnect:hover:not(:disabled) {
          background: #d97706;
        }

        .btn-disconnect {
          background: #ef4444;
          color: white;
        }

        .btn-disconnect:hover {
          background: #dc2626;
        }

        .btn-connect:disabled,
        .btn-reconnect:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 640px) {
          .account-card {
            flex-direction: column;
            align-items: flex-start;
          }

          .account-actions {
            width: 100%;
          }

          .btn-connect,
          .btn-disconnect,
          .btn-reconnect {
            flex: 1;
          }
        }
      `}</style>
    </div>
  );
}
