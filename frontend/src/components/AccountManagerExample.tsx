/**
 * Example usage of AccountManager component
 * This demonstrates how to integrate the account management UI
 */

import { useState } from 'react';
import { AccountManager } from './AccountManager';
import type { ShareablePlatform } from '../lib/social/types';

export function AccountManagerExample() {
  const [showManager, setShowManager] = useState(false);
  const [lastAction, setLastAction] = useState<string>('');

  const handleAccountConnected = (platform: ShareablePlatform) => {
    setLastAction(`Connected ${platform} account`);
    console.log(`Account connected: ${platform}`);
  };

  const handleAccountDisconnected = (platform: ShareablePlatform) => {
    setLastAction(`Disconnected ${platform} account`);
    console.log(`Account disconnected: ${platform}`);
  };

  return (
    <div className="account-manager-example">
      <div className="example-header">
        <h1>Social Media Account Management</h1>
        <p>Connect and manage your social media accounts</p>
      </div>

      <div className="example-controls">
        <button
          className="btn-toggle"
          onClick={() => setShowManager(!showManager)}
        >
          {showManager ? 'Hide' : 'Show'} Account Manager
        </button>

        {lastAction && (
          <div className="last-action">
            Last action: {lastAction}
          </div>
        )}
      </div>

      {showManager && (
        <AccountManager
          onAccountConnected={handleAccountConnected}
          onAccountDisconnected={handleAccountDisconnected}
        />
      )}

      <style>{`
        .account-manager-example {
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .example-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .example-header h1 {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }

        .example-header p {
          color: #666;
          font-size: 1rem;
        }

        .example-controls {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .btn-toggle {
          padding: 0.75rem 1.5rem;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }

        .btn-toggle:hover {
          background: #2563eb;
        }

        .last-action {
          padding: 0.75rem 1rem;
          background: #f0fdf4;
          border: 1px solid #10b981;
          border-radius: 6px;
          color: #065f46;
          font-size: 0.875rem;
        }
      `}</style>
    </div>
  );
}
