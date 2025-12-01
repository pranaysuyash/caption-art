/**
 * Platform Selector Component
 * Allows users to select one or multiple social media platforms
 * Requirements: 1.1, 7.1
 */

import { useState, useEffect } from 'react';
import type { ShareablePlatform } from '../lib/social/types';
import { platformManager } from '../lib/social/platformManager';

export interface PlatformSelectorProps {
  selectedPlatforms: ShareablePlatform[];
  onSelectionChange: (platforms: ShareablePlatform[]) => void;
  multiSelect?: boolean;
  showAuthStatus?: boolean;
}

export function PlatformSelector({
  selectedPlatforms,
  onSelectionChange,
  multiSelect = false,
  showAuthStatus = true,
}: PlatformSelectorProps) {
  const platforms: ShareablePlatform[] = ['instagram', 'twitter', 'facebook', 'pinterest'];
  const [authStatuses, setAuthStatuses] = useState<Record<ShareablePlatform, boolean>>({
    instagram: false,
    twitter: false,
    facebook: false,
    pinterest: false,
  });

  // Load auth statuses on mount
  useEffect(() => {
    if (showAuthStatus) {
      platforms.forEach(async (platform) => {
        const status = await platformManager.checkAuthStatus(platform);
        setAuthStatuses((prev) => ({ ...prev, [platform]: status.isAuthenticated }));
      });
    }
  }, [showAuthStatus]);

  const handlePlatformClick = (platform: ShareablePlatform) => {
    if (multiSelect) {
      // Toggle platform in multi-select mode
      if (selectedPlatforms.includes(platform)) {
        onSelectionChange(selectedPlatforms.filter((p) => p !== platform));
      } else {
        onSelectionChange([...selectedPlatforms, platform]);
      }
    } else {
      // Single select mode
      onSelectionChange([platform]);
    }
  };

  const getPlatformIcon = (platform: ShareablePlatform): string => {
    const icons: Record<ShareablePlatform, string> = {
      instagram: '📷',
      twitter: '🐦',
      facebook: '👥',
      pinterest: '📌',
    };
    return icons[platform];
  };

  const getPlatformDisplayName = (platform: ShareablePlatform): string => {
    const config = platformManager.getPlatformConfig(platform);
    return config.displayName;
  };

  return (
    <div className="platform-selector">
      <div className="platform-selector-header">
        <h3>Select Platform{multiSelect ? 's' : ''}</h3>
        {multiSelect && (
          <p className="platform-selector-hint">
            Select one or more platforms to share your content
          </p>
        )}
      </div>

      <div className="platform-grid">
        {platforms.map((platform) => {
          const isSelected = selectedPlatforms.includes(platform);
          const isAuthenticated = authStatuses[platform];

          return (
            <button
              key={platform}
              className={`platform-card ${isSelected ? 'selected' : ''} ${
                !isAuthenticated && showAuthStatus ? 'not-authenticated' : ''
              }`}
              onClick={() => handlePlatformClick(platform)}
              type="button"
            >
              <div className="platform-icon">{getPlatformIcon(platform)}</div>
              <div className="platform-name">{getPlatformDisplayName(platform)}</div>
              {showAuthStatus && !isAuthenticated && (
                <div className="platform-auth-badge">Not connected</div>
              )}
              {isSelected && <div className="platform-check">✓</div>}
            </button>
          );
        })}
      </div>

      <style>{`
        .platform-selector {
          width: 100%;
        }

        .platform-selector-header {
          margin-bottom: 1rem;
        }

        .platform-selector-header h3 {
          font-size: 1.125rem;
          font-weight: 600;
          margin-bottom: 0.25rem;
        }

        .platform-selector-hint {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .platform-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 1rem;
        }

        .platform-card {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          padding: 1.5rem 1rem;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          transition: all 0.2s;
        }

        .platform-card:hover {
          border-color: #3b82f6;
          transform: translateY(-2px);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .platform-card.selected {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        .platform-card.not-authenticated {
          opacity: 0.6;
        }

        .platform-card.not-authenticated:hover {
          border-color: #f59e0b;
        }

        .platform-icon {
          font-size: 2rem;
        }

        .platform-name {
          font-weight: 500;
          font-size: 0.875rem;
          text-align: center;
        }

        .platform-auth-badge {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          padding: 0.25rem 0.5rem;
          background: #fef3c7;
          border: 1px solid #fbbf24;
          border-radius: 4px;
          font-size: 0.625rem;
          color: #92400e;
        }

        .platform-check {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          width: 1.5rem;
          height: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #3b82f6;
          color: white;
          border-radius: 50%;
          font-size: 0.875rem;
          font-weight: bold;
        }

        @media (max-width: 640px) {
          .platform-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
}
