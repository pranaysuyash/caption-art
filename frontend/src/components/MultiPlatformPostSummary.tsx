/**
 * Multi-Platform Post Summary Component
 * Displays results of posting to multiple platforms
 * Requirements: 7.5
 */

import type { MultiPlatformResult, PostResult } from '../lib/social/types';
import { platformManager } from '../lib/social/platformManager';

export interface MultiPlatformPostSummaryProps {
  result: MultiPlatformResult;
  onClose?: () => void;
  onRetry?: (platform: string) => void;
}

export function MultiPlatformPostSummary({
  result,
  onClose,
  onRetry,
}: MultiPlatformPostSummaryProps) {
  const getPlatformIcon = (platform: string): string => {
    const icons: Record<string, string> = {
      instagram: '📷',
      twitter: '🐦',
      facebook: '👥',
      pinterest: '📌',
    };
    return icons[platform] || '📱';
  };

  const getPlatformDisplayName = (platform: string): string => {
    try {
      const config = platformManager.getPlatformConfig(platform as any);
      return config.displayName;
    } catch {
      return platform;
    }
  };

  const successResults = result.results.filter((r) => r.success);
  const failureResults = result.results.filter((r) => !r.success);

  return (
    <div className="multi-platform-summary">
      <div className="summary-header">
        <h2>Post Summary</h2>
        <div className="summary-stats">
          <div className="summary-stat success">
            <span className="stat-icon">✓</span>
            <span className="stat-label">{result.successCount} Successful</span>
          </div>
          {result.failureCount > 0 && (
            <div className="summary-stat failure">
              <span className="stat-icon">✗</span>
              <span className="stat-label">{result.failureCount} Failed</span>
            </div>
          )}
        </div>
      </div>

      {/* Successful Posts */}
      {successResults.length > 0 && (
        <div className="summary-section">
          <h3 className="section-title success-title">✓ Successfully Posted</h3>
          <div className="result-list">
            {successResults.map((postResult) => (
              <div key={postResult.platform} className="result-card success-card">
                <div className="result-icon">{getPlatformIcon(postResult.platform)}</div>
                <div className="result-info">
                  <div className="result-platform">
                    {getPlatformDisplayName(postResult.platform)}
                  </div>
                  <div className="result-status">Posted successfully</div>
                </div>
                {postResult.postUrl && (
                  <a
                    href={postResult.postUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="result-link"
                  >
                    View Post →
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Failed Posts */}
      {failureResults.length > 0 && (
        <div className="summary-section">
          <h3 className="section-title failure-title">✗ Failed to Post</h3>
          <div className="result-list">
            {failureResults.map((postResult) => (
              <div key={postResult.platform} className="result-card failure-card">
                <div className="result-icon">{getPlatformIcon(postResult.platform)}</div>
                <div className="result-info">
                  <div className="result-platform">
                    {getPlatformDisplayName(postResult.platform)}
                  </div>
                  <div className="result-error">{postResult.error || 'Unknown error'}</div>
                  {postResult.errorDetails?.actions && postResult.errorDetails.actions.length > 0 && (
                    <div className="result-suggestion">
                      💡 {postResult.errorDetails.actions[0].label}
                    </div>
                  )}
                </div>
                {onRetry && (
                  <button
                    className="result-retry"
                    onClick={() => onRetry(postResult.platform)}
                  >
                    Retry
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="summary-actions">
        {onClose && (
          <button className="btn-close" onClick={onClose}>
            Close
          </button>
        )}
      </div>

      <style>{`
        .multi-platform-summary {
          max-width: 600px;
          margin: 0 auto;
        }

        .summary-header {
          margin-bottom: 2rem;
        }

        .summary-header h2 {
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 1rem;
        }

        .summary-stats {
          display: flex;
          gap: 1rem;
        }

        .summary-stat {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .summary-stat.success {
          background: #d1fae5;
          color: #065f46;
        }

        .summary-stat.failure {
          background: #fee2e2;
          color: #991b1b;
        }

        .stat-icon {
          font-size: 1rem;
          font-weight: bold;
        }

        .summary-section {
          margin-bottom: 2rem;
        }

        .section-title {
          font-size: 1.125rem;
          font-weight: 600;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .success-title {
          color: #065f46;
        }

        .failure-title {
          color: #991b1b;
        }

        .result-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .result-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          border-radius: 8px;
          border: 2px solid;
        }

        .success-card {
          background: #f0fdf4;
          border-color: #10b981;
        }

        .failure-card {
          background: #fef2f2;
          border-color: #ef4444;
        }

        .result-icon {
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

        .result-info {
          flex: 1;
          min-width: 0;
        }

        .result-platform {
          font-weight: 600;
          font-size: 1rem;
          margin-bottom: 0.25rem;
        }

        .result-status {
          font-size: 0.875rem;
          color: #065f46;
        }

        .result-error {
          font-size: 0.875rem;
          color: #991b1b;
          margin-bottom: 0.25rem;
        }

        .result-suggestion {
          font-size: 0.75rem;
          color: #6b7280;
          margin-top: 0.5rem;
          padding: 0.5rem;
          background: white;
          border-radius: 4px;
        }

        .result-link {
          padding: 0.5rem 1rem;
          background: #3b82f6;
          color: white;
          text-decoration: none;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 500;
          white-space: nowrap;
          transition: background 0.2s;
        }

        .result-link:hover {
          background: #2563eb;
        }

        .result-retry {
          padding: 0.5rem 1rem;
          background: #f59e0b;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }

        .result-retry:hover {
          background: #d97706;
        }

        .summary-actions {
          display: flex;
          justify-content: center;
          padding-top: 1rem;
          border-top: 2px solid #e5e7eb;
        }

        .btn-close {
          padding: 0.75rem 2rem;
          background: #6b7280;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }

        .btn-close:hover {
          background: #4b5563;
        }

        @media (max-width: 640px) {
          .result-card {
            flex-direction: column;
            align-items: flex-start;
          }

          .result-link,
          .result-retry {
            width: 100%;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}
