/**
 * Consent Banner Component
 * 
 * Displays a consent banner for analytics tracking:
 * - Shows on first visit (Requirement 4.1)
 * - Allows opt-in (Requirement 4.3)
 * - Allows opt-out (Requirement 4.2)
 * - Persists preference (Requirement 4.5)
 * 
 * Usage:
 * ```tsx
 * import { ConsentBanner } from './components/ConsentBanner';
 * 
 * function App() {
 *   return (
 *     <>
 *       <ConsentBanner onConsent={(consented) => {
 *         console.log('User consent:', consented);
 *       }} />
 *       {/* Rest of your app *\/}
 *     </>
 *   );
 * }
 * ```
 */

import { useState, useEffect } from 'react';
import { getAnalyticsManager } from '../lib/analytics/analyticsManager';

interface ConsentBannerProps {
  onConsent?: (consented: boolean) => void;
}

export function ConsentBanner({ onConsent }: ConsentBannerProps) {
  const [visible, setVisible] = useState(false);
  const analyticsManager = getAnalyticsManager();

  useEffect(() => {
    // Check if we should show the consent banner
    setVisible(analyticsManager.shouldShowConsentBanner());
  }, []);

  const handleOptIn = () => {
    analyticsManager.optIn();
    setVisible(false);
    onConsent?.(true);
  };

  const handleOptOut = () => {
    analyticsManager.optOut();
    setVisible(false);
    onConsent?.(false);
  };

  if (!visible) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        border: '3px solid #000',
        borderBottom: 'none',
        boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.1)',
        padding: '20px',
        zIndex: 9999,
      }}
      role="dialog"
      aria-labelledby="consent-banner-title"
      aria-describedby="consent-banner-description"
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '15px',
        }}
      >
        <div>
          <h2
            id="consent-banner-title"
            style={{
              margin: '0 0 10px 0',
              fontSize: '18px',
              fontWeight: 'bold',
            }}
          >
            Analytics & Privacy
          </h2>
          <p
            id="consent-banner-description"
            style={{
              margin: 0,
              fontSize: '14px',
              lineHeight: '1.5',
              color: '#333',
            }}
          >
            We use analytics to improve your experience and understand how our application is used.
            Your data is anonymized and we never collect personally identifiable information.
            You can opt out at any time in settings.
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '10px',
            flexWrap: 'wrap',
          }}
        >
          <button
            onClick={handleOptIn}
            aria-label="Accept analytics tracking"
            style={{
              padding: '12px 24px',
              border: '2px solid #000',
              borderRadius: '4px',
              backgroundColor: '#4CAF50',
              color: '#fff',
              fontWeight: 'bold',
              fontSize: '14px',
              cursor: 'pointer',
              boxShadow: '3px 3px 0 #000',
              transition: 'transform 0.1s ease',
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'translate(2px, 2px)';
              e.currentTarget.style.boxShadow = '1px 1px 0 #000';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'translate(0, 0)';
              e.currentTarget.style.boxShadow = '3px 3px 0 #000';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translate(0, 0)';
              e.currentTarget.style.boxShadow = '3px 3px 0 #000';
            }}
          >
            Accept Analytics
          </button>

          <button
            onClick={handleOptOut}
            aria-label="Decline analytics tracking"
            style={{
              padding: '12px 24px',
              border: '2px solid #000',
              borderRadius: '4px',
              backgroundColor: '#fff',
              color: '#000',
              fontWeight: 'bold',
              fontSize: '14px',
              cursor: 'pointer',
              boxShadow: '3px 3px 0 #000',
              transition: 'transform 0.1s ease',
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'translate(2px, 2px)';
              e.currentTarget.style.boxShadow = '1px 1px 0 #000';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'translate(0, 0)';
              e.currentTarget.style.boxShadow = '3px 3px 0 #000';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translate(0, 0)';
              e.currentTarget.style.boxShadow = '3px 3px 0 #000';
            }}
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  );
}
