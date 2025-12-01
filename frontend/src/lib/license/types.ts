/**
 * Core types and interfaces for the License and Paywall System
 */

/**
 * License status information
 */
export interface LicenseStatus {
  isValid: boolean;
  isPremium: boolean;
  licenseKey: string | null;
  expiresAt: Date | null;
  purchaseDate: Date | null;
  email: string | null;
}

/**
 * Result of license verification
 */
export interface VerificationResult {
  success: boolean;
  purchase: GumroadPurchase | null;
  error: string | null;
}

/**
 * License state for UI components
 */
export interface LicenseState {
  status: 'checking' | 'valid' | 'invalid' | 'expired' | 'none';
  licenseKey: string | null;
  isPremium: boolean;
  email: string | null;
  error: string | null;
  lastVerified: Date | null;
}

/**
 * Access level type
 */
export type AccessLevel = 'free' | 'premium';

/**
 * Features available at each access level
 */
export interface AccessFeatures {
  level: AccessLevel;
  canExportUnwatermarked: boolean;
  hasExportLimit: boolean;
  exportLimit: number | null;
  features: string[];
}

/**
 * Gumroad purchase response from API
 */
export interface GumroadPurchase {
  success: boolean;
  uses: number;
  purchase: {
    seller_id: string;
    product_id: string;
    product_name: string;
    permalink: string;
    product_permalink: string;
    email: string;
    price: number;
    gumroad_fee: number;
    currency: string;
    quantity: number;
    discover_fee_charged: boolean;
    can_contact: boolean;
    referrer: string;
    card: {
      visual: string | null;
      type: string | null;
      bin: string | null;
      expiry_month: string | null;
      expiry_year: string | null;
    };
    order_number: number;
    sale_id: string;
    sale_timestamp: string;
    purchaser_id: string;
    subscription_id: string | null;
    variants: string;
    license_key: string;
    is_multiseat_license: boolean;
    ip_country: string;
    recurrence: string;
    is_gift_receiver_purchase: boolean;
    refunded: boolean;
    disputed: boolean;
    dispute_won: boolean;
    id: string;
    created_at: string;
    custom_fields: Record<string, any>;
    chargebacked: boolean;
    subscription_ended_at: string | null;
    subscription_cancelled_at: string | null;
    subscription_failed_at: string | null;
  };
}

/**
 * Stored license data in localStorage
 */
export interface StoredLicense {
  licenseKey: string;
  verifiedAt: number; // timestamp
  expiresAt: number | null;
  email: string | null;
  productPermalink: string;
}

/**
 * Export quota state
 */
export interface QuotaState {
  remaining: number;
  resetAt: number; // timestamp
  total: number;
}

/**
 * Watermark configuration
 */
export interface WatermarkConfig {
  text: string;
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  padding: number;
  fontSize: number;
  opacity: number;
  color: string;
  shadowColor: string;
  shadowBlur: number;
}

/**
 * License manager configuration
 */
export interface LicenseManagerConfig {
  gumroadProductPermalink: string;
  gumroadAccessToken: string;
  storageKey: string;
}
