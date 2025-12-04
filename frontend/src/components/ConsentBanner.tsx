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
import styles from './ConsentBanner.module.css';

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
      className={styles.consentBanner}
      role='dialog'
      aria-labelledby='consent-banner-title'
      aria-describedby='consent-banner-description'
    >
      <div className={styles.consentContent}>
        <div className={styles.consentTextContainer}>
          <h2 id='consent-banner-title' className={styles.consentTitle}>
            Analytics & Privacy
          </h2>
          <p
            id='consent-banner-description'
            className={styles.consentDescription}
          >
            We use analytics to improve your experience and understand how our
            application is used. Your data is anonymized and we never collect
            personally identifiable information. You can opt out at any time in
            settings.
          </p>
        </div>

        <div className={styles.buttonGroup}>
          <button
            onClick={handleOptIn}
            aria-label='Accept analytics tracking'
            className={`${styles.buttonBase} ${styles.acceptButton}`}
          >
            Accept Analytics
          </button>

          <button
            onClick={handleOptOut}
            aria-label='Decline analytics tracking'
            className={`${styles.buttonBase} ${styles.declineButton}`}
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  );
}
