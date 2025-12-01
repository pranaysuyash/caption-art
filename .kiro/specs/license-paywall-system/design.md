# Design Document - License and Paywall System

## Overview

This design document outlines the technical approach for the License and Paywall System, which manages user access to premium features through Gumroad license verification, enforces free tier limitations, and controls watermark application. The system provides a seamless upgrade path from free to premium access.

The verification pipeline:
1. User enters license key
2. Gumroad API verification
3. License validation (not refunded/chargebacked)
4. localStorage persistence
5. Access level determination
6. Feature gating and watermark control

## Architecture

### Component Structure

```
frontend/src/
├── lib/
│   ├── license/
│   │   ├── licenseManager.ts      # Main license orchestrator
│   │   ├── gumroadClient.ts       # Gumroad API client
│   │   ├── licenseStorage.ts      # localStorage management
│   │   ├── exportQuota.ts         # Free tier quota tracking
│   │   └── watermarkRenderer.ts   # Watermark application
│   └── utils/
│       ├── dateUtils.ts           # Date/time utilities
│       └── validation.ts          # Input validation
└── components/
    ├── LicenseInput.tsx           # License key input
    ├── AccessBadge.tsx            # Premium/Free tier badge
    ├── ExportQuotaDisplay.tsx     # Remaining exports counter
    └── UpgradePrompt.tsx          # Upgrade CTA
```

### Data Flow

```
User Input → License Validation → Gumroad API → Verification Result
                                                        ↓
                                                  localStorage
                                                        ↓
                                                  Access Level → Feature Gating
                                                        ↓
                                                  Export Control → Watermark
```

## Components and Interfaces

### 1. LicenseManager

**Purpose**: Orchestrates license verification and access control

**Interface**:
```typescript
interface LicenseManagerConfig {
  gumroadProductPermalink: string
  gumroadAccessToken: string
  storageKey: string
}

interface LicenseStatus {
  isValid: boolean
  isPremium: boolean
  licenseKey: string | null
  expiresAt: Date | null
  purchaseDate: Date | null
  email: string | null
}

interface VerificationResult {
  success: boolean
  purchase: GumroadPurchase | null
  error: string | null
}

class LicenseManager {
  constructor(config: LicenseManagerConfig)
  
  async verify(licenseKey: string): Promise<VerificationResult>
  async checkSavedLicense(): Promise<LicenseStatus>
  saveLicense(licenseKey: string): void
  removeLicense(): void
  getStatus(): LicenseStatus
  isPremium(): boolean
}
```

**Behavior**:
- Validates license key format before API call
- Calls Gumroad Verify API
- Checks purchase is not refunded or chargebacked
- Saves valid licenses to localStorage
- Auto-verifies saved licenses on app load
- Provides access level information

### 2. GumroadClient

**Purpose**: Manages communication with Gumroad Verify API

**Interface**:
```typescript
interface GumroadPurchase {
  success: boolean
  uses: number
  purchase: {
    seller_id: string
    product_id: string
    product_name: string
    permalink: string
    product_permalink: string
    email: string
    price: number
    gumroad_fee: number
    currency: string
    quantity: number
    discover_fee_charged: boolean
    can_contact: boolean
    referrer: string
    card: {
      visual: string | null
      type: string | null
      bin: string | null
      expiry_month: string | null
      expiry_year: string | null
    }
    order_number: number
    sale_id: string
    sale_timestamp: string
    purchaser_id: string
    subscription_id: string | null
    variants: string
    license_key: string
    is_multiseat_license: boolean
    ip_country: string
    recurrence: string
    is_gift_receiver_purchase: boolean
    refunded: boolean
    disputed: boolean
    dispute_won: boolean
    id: string
    created_at: string
    custom_fields: Record<string, any>
    chargebacked: boolean
    subscription_ended_at: string | null
    subscription_cancelled_at: string | null
    subscription_failed_at: string | null
  }
}

class GumroadClient {
  constructor(productPermalink: string, accessToken: string)
  
  async verifyLicense(licenseKey: string): Promise<GumroadPurchase>
  isValidPurchase(purchase: GumroadPurchase): boolean
}
```

**Gumroad API Configuration**:
- Endpoint: `https://api.gumroad.com/v2/licenses/verify`
- Method: POST
- Parameters:
  - `product_permalink`: Product identifier
  - `license_key`: User's license key
  - `access_token`: API access token (optional, for additional data)

**Validation Checks**:
- `success === true`
- `purchase.refunded === false`
- `purchase.chargebacked === false`
- `purchase.disputed === false` OR `purchase.dispute_won === true`

### 3. LicenseStorage

**Purpose**: Manages localStorage persistence of license data

**Interface**:
```typescript
interface StoredLicense {
  licenseKey: string
  verifiedAt: number // timestamp
  expiresAt: number | null
  email: string | null
  productPermalink: string
}

class LicenseStorage {
  constructor(storageKey: string)
  
  save(license: StoredLicense): void
  load(): StoredLicense | null
  remove(): void
  isExpired(license: StoredLicense): boolean
}
```

**Storage Strategy**:
- Key: `caption-art-license`
- Format: JSON string
- Expiration: Re-verify after 7 days
- Encryption: Not needed (license keys are not sensitive)
- Fallback: If localStorage unavailable, use in-memory storage

### 4. ExportQuota

**Purpose**: Tracks and enforces free tier export limits

**Interface**:
```typescript
interface QuotaState {
  remaining: number
  resetAt: number // timestamp
  total: number
}

class ExportQuota {
  constructor(dailyLimit: number)
  
  getRemainingExports(): number
  canExport(): boolean
  consumeExport(): boolean
  reset(): void
  getResetTime(): Date
  private checkAndResetIfNeeded(): void
}
```

**Quota Rules**:
- Free tier: 2 exports per day
- Premium: Unlimited (quota check bypassed)
- Reset: Daily at midnight local time
- Storage: localStorage with key `caption-art-quota`
- Enforcement: Client-side (soft limit)

**Behavior**:
- Check if quota needs reset on every access
- Decrement remaining count on export
- Prevent export when quota exhausted
- Display remaining count to user
- Reset at midnight local time

### 5. WatermarkRenderer

**Purpose**: Applies watermark to exported images

**Interface**:
```typescript
interface WatermarkConfig {
  text: string
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  padding: number
  fontSize: number
  opacity: number
  color: string
  shadowColor: string
  shadowBlur: number
}

class WatermarkRenderer {
  static apply(
    canvas: HTMLCanvasElement,
    config: WatermarkConfig
  ): void
  
  static getDefaultConfig(): WatermarkConfig
}
```

**Default Watermark Configuration**:
- Text: "Caption Art - Free Tier"
- Position: bottom-right
- Padding: 20px from edges
- Font size: 16px
- Opacity: 40% (0.4)
- Color: white (#FFFFFF)
- Shadow: dark shadow for readability
- Shadow blur: 4px

**Rendering**:
- Draw text on top layer (after all compositing)
- Use shadow for contrast on any background
- Position relative to canvas dimensions
- Scale font size with canvas size (if needed)

## Data Models

### LicenseState

```typescript
interface LicenseState {
  status: 'checking' | 'valid' | 'invalid' | 'expired' | 'none'
  licenseKey: string | null
  isPremium: boolean
  email: string | null
  error: string | null
  lastVerified: Date | null
}
```

### AccessLevel

```typescript
type AccessLevel = 'free' | 'premium'

interface AccessFeatures {
  level: AccessLevel
  canExportUnwatermarked: boolean
  hasExportLimit: boolean
  exportLimit: number | null
  features: string[]
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: License persistence round-trip
*For any* valid license key that is saved, after closing and reopening the browser, the license should still be valid and premium access should be enabled
**Validates: Requirements 2.1, 2.2, 2.3**

### Property 2: Refunded license rejection
*For any* license key where the Gumroad API returns `refunded: true`, the verification should fail and premium access should not be granted
**Validates: Requirements 1.5, 7.2**

### Property 3: Chargebacked license rejection
*For any* license key where the Gumroad API returns `chargebacked: true`, the verification should fail and premium access should not be granted
**Validates: Requirements 1.5, 7.3**

### Property 4: Premium export unlimited
*For any* user with valid premium access, the export function should succeed regardless of how many times it's called in a day
**Validates: Requirements 3.2, 3.5**

### Property 5: Free tier quota enforcement
*For any* free tier user, after consuming 2 exports in a day, the export button should be disabled until the next day
**Validates: Requirements 4.2, 4.3**

### Property 6: Daily quota reset
*For any* free tier user with exhausted quota, after midnight local time, the quota should reset to 2 available exports
**Validates: Requirements 4.5**

### Property 7: Watermark presence on free exports
*For any* free tier export, the final image should contain the watermark text "Caption Art - Free Tier" at the bottom-right corner
**Validates: Requirements 4.1, 8.5**

### Property 8: Watermark absence on premium exports
*For any* premium export, the final image should not contain any watermark
**Validates: Requirements 3.1, 3.5**

### Property 9: Watermark positioning accuracy
*For any* watermarked export, the watermark should be positioned exactly 20px from the bottom edge and 20px from the right edge
**Validates: Requirements 8.1**

### Property 10: Watermark opacity consistency
*For any* watermarked export, the watermark opacity should be 40% (alpha value of 102 out of 255)
**Validates: Requirements 8.2**

### Property 11: Badge display accuracy
*For any* user state, if premium access is active, the badge should display "Premium"; otherwise it should display "Free Tier"
**Validates: Requirements 3.3, 6.1, 6.2**

### Property 12: Quota display accuracy
*For any* free tier user, the displayed remaining export count should match the actual remaining quota
**Validates: Requirements 5.1, 5.2, 5.3**

### Property 13: License format validation
*For any* license key input, if the format is invalid (not alphanumeric), the system should reject it before calling the API
**Validates: Requirements 1.1**

## Error Handling

### Gumroad API Errors

**Connection Failures**:
- Retry up to 2 times
- Display: "Unable to verify license. Please check your connection."
- Allow user to retry manually

**Invalid License Key**:
- Display: "Invalid license key. Please check and try again."
- Clear input field
- Provide link to purchase page

**Refunded Purchase**:
- Display: "This license has been refunded and is no longer valid."
- Remove from localStorage
- Revert to free tier

**Chargebacked Purchase**:
- Display: "This license is no longer valid."
- Remove from localStorage
- Revert to free tier

**Rate Limiting**:
- Display: "Too many verification attempts. Please try again in a few minutes."
- Disable verify button temporarily

**API Unavailable**:
- Display: "License verification service unavailable. Please try again later."
- If saved license exists, allow temporary access with warning

### localStorage Errors

**Storage Unavailable**:
- Fall back to in-memory storage
- Display warning: "License will not persist across sessions."
- Still allow verification and premium access

**Storage Full**:
- Clear old data
- Retry save
- If still fails, use in-memory storage

**Corrupted Data**:
- Clear corrupted entry
- Display: "License data corrupted. Please re-enter your license key."

### Quota Tracking Errors

**Clock Skew**:
- Detect if system time changed significantly
- Reset quota to be safe
- Log warning to console

**Corrupted Quota Data**:
- Reset to default (2 exports)
- Log warning to console

## Testing Strategy

### Unit Tests

**LicenseManager**:
- Test license verification flow
- Test saved license loading
- Test license removal
- Test premium status check

**GumroadClient**:
- Test API request formatting
- Test response parsing
- Test validation logic (refunded, chargebacked)
- Test error handling

**LicenseStorage**:
- Test save/load cycle
- Test expiration checking
- Test removal
- Test corrupted data handling

**ExportQuota**:
- Test quota consumption
- Test daily reset logic
- Test remaining count calculation
- Test exhaustion detection

**WatermarkRenderer**:
- Test watermark positioning
- Test opacity application
- Test text rendering
- Test shadow rendering

### Property-Based Tests

The property-based testing library for this project is **fast-check** (JavaScript/TypeScript).

Each property-based test should run a minimum of 100 iterations.

**Property 1: License persistence round-trip**
- Generate random valid license keys
- Save to localStorage
- Clear memory state
- Load from localStorage
- Verify license is still valid

**Property 2: Refunded license rejection**
- Generate random license keys
- Mock API with refunded: true
- Verify verification fails
- Verify premium access not granted

**Property 3: Chargebacked license rejection**
- Generate random license keys
- Mock API with chargebacked: true
- Verify verification fails
- Verify premium access not granted

**Property 4: Premium export unlimited**
- Generate random export counts (1-1000)
- Set premium access
- Attempt all exports
- Verify all succeed

**Property 5: Free tier quota enforcement**
- Start with 2 exports remaining
- Consume 2 exports
- Attempt 3rd export
- Verify blocked

**Property 6: Daily quota reset**
- Exhaust quota
- Simulate time passing to next day
- Check quota
- Verify reset to 2

**Property 7: Watermark presence on free exports**
- Generate random canvas content
- Export as free tier
- Scan image for watermark text
- Verify present at bottom-right

**Property 8: Watermark absence on premium exports**
- Generate random canvas content
- Export as premium
- Scan image for watermark text
- Verify absent

**Property 9: Watermark positioning accuracy**
- Generate random canvas sizes
- Apply watermark
- Measure position
- Verify 20px from bottom-right

**Property 10: Watermark opacity consistency**
- Generate random canvas content
- Apply watermark
- Sample watermark pixels
- Verify alpha ≈ 102 (40%)

**Property 11: Badge display accuracy**
- Generate random access states
- Render badge
- Verify text matches access level

**Property 12: Quota display accuracy**
- Generate random quota states
- Render display
- Verify count matches actual quota

**Property 13: License format validation**
- Generate random strings (valid and invalid)
- Attempt validation
- Verify invalid formats rejected before API call

### Integration Tests

**Full Verification Flow**:
- Enter license key
- Verify with Gumroad API
- Check premium access granted
- Verify localStorage updated
- Verify badge updated

**Export Flow (Free Tier)**:
- Start with 2 exports
- Export image (watermarked)
- Verify quota decremented
- Export again (watermarked)
- Verify quota exhausted
- Attempt 3rd export
- Verify blocked

**Export Flow (Premium)**:
- Verify license
- Export multiple images
- Verify no watermarks
- Verify no quota limits

**License Persistence**:
- Verify license
- Reload page
- Verify still premium
- Verify no re-verification needed (within 7 days)

**Quota Reset**:
- Exhaust quota
- Simulate day change
- Reload page
- Verify quota reset

## Implementation Notes

### Gumroad API Integration

**API Request**:
```typescript
async function verifyLicense(licenseKey: string): Promise<GumroadPurchase> {
  const response = await fetch('https://api.gumroad.com/v2/licenses/verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      product_permalink: 'caption-art', // Your product permalink
      license_key: licenseKey
    })
  })
  
  if (!response.ok) {
    throw new Error('Verification request failed')
  }
  
  return await response.json()
}
```

**Validation Logic**:
```typescript
function isValidPurchase(purchase: GumroadPurchase): boolean {
  if (!purchase.success) return false
  if (!purchase.purchase) return false
  
  const p = purchase.purchase
  
  // Check for refunds and chargebacks
  if (p.refunded) return false
  if (p.chargebacked) return false
  
  // Check for disputes (unless won)
  if (p.disputed && !p.dispute_won) return false
  
  return true
}
```

### localStorage Schema

**License Storage**:
```typescript
interface StoredLicense {
  licenseKey: string
  verifiedAt: number
  expiresAt: number | null
  email: string | null
  productPermalink: string
}

// Save
localStorage.setItem('caption-art-license', JSON.stringify(license))

// Load
const stored = localStorage.getItem('caption-art-license')
const license = stored ? JSON.parse(stored) : null
```

**Quota Storage**:
```typescript
interface StoredQuota {
  remaining: number
  resetAt: number
  total: number
}

// Save
localStorage.setItem('caption-art-quota', JSON.stringify(quota))

// Load
const stored = localStorage.getItem('caption-art-quota')
const quota = stored ? JSON.parse(stored) : { remaining: 2, resetAt: getNextMidnight(), total: 2 }
```

### Daily Reset Logic

```typescript
function getNextMidnight(): number {
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)
  return tomorrow.getTime()
}

function checkAndResetQuota(quota: StoredQuota): StoredQuota {
  const now = Date.now()
  
  if (now >= quota.resetAt) {
    return {
      remaining: quota.total,
      resetAt: getNextMidnight(),
      total: quota.total
    }
  }
  
  return quota
}
```

### Watermark Rendering

```typescript
function applyWatermark(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d')!
  
  const text = 'Caption Art - Free Tier'
  const fontSize = 16
  const padding = 20
  const opacity = 0.4
  
  ctx.save()
  
  // Set styles
  ctx.font = `${fontSize}px Inter, sans-serif`
  ctx.fillStyle = '#FFFFFF'
  ctx.globalAlpha = opacity
  
  // Add shadow for readability
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)'
  ctx.shadowBlur = 4
  ctx.shadowOffsetX = 1
  ctx.shadowOffsetY = 1
  
  // Measure text
  const metrics = ctx.measureText(text)
  const textWidth = metrics.width
  const textHeight = fontSize
  
  // Position at bottom-right
  const x = canvas.width - textWidth - padding
  const y = canvas.height - padding
  
  // Draw text
  ctx.fillText(text, x, y)
  
  ctx.restore()
}
```

### Security Considerations

**API Key Exposure**:
- Gumroad access token should be optional
- If used, should be in environment variables
- Consider backend proxy for production

**License Key Storage**:
- License keys are not sensitive (can be shared)
- No encryption needed in localStorage
- Re-verification every 7 days prevents abuse

**Quota Bypass**:
- Client-side enforcement is soft limit
- Users can bypass by clearing localStorage
- Acceptable for free tier (low stakes)
- Premium users have no limits anyway

### Performance Optimization

- Cache verification results for 7 days
- Lazy load Gumroad API (only when needed)
- Debounce license input validation
- Prefetch verification on app load (if saved license)
- Use Web Workers for watermark rendering (if slow)

### Browser Compatibility

- Use `fetch` API (widely supported)
- Polyfill `URLSearchParams` for older browsers
- Handle localStorage unavailability gracefully
- Test in Chrome, Firefox, Safari
- Test on mobile browsers

### Accessibility

- Announce verification status to screen readers
- Provide loading indicators
- Use semantic HTML for license input
- Ensure keyboard navigation works
- Provide clear error messages

### User Experience

- Auto-verify saved license on load
- Show verification progress
- Provide clear upgrade prompts
- Display remaining exports prominently
- Make watermark subtle but visible
- Provide easy license removal option
