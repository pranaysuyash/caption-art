# Design Document - DodoPayments Integration

## Overview

This design document outlines the technical approach for integrating DodoPayments as a payment processing system for the Caption Art application. The system will provide checkout flows, license verification, subscription management, and webhook handling while maintaining backward compatibility with existing Gumroad licenses.

The payment flow:
1. User initiates checkout (one-time or subscription)
2. DodoPayments hosted checkout page
3. Payment processing
4. License key generation
5. Automatic verification and activation
6. Webhook updates for subscription events

## Architecture

### Component Structure

```
frontend/src/
├── lib/
│   ├── payments/
│   │   ├── dodoPaymentsClient.ts      # DodoPayments API client
│   │   ├── checkoutManager.ts         # Checkout flow orchestration
│   │   ├── subscriptionManager.ts     # Subscription status tracking
│   │   └── paymentStorage.ts          # Payment data persistence
│   └── license/
│       ├── licenseManager.ts          # Unified license management (Gumroad + Dodo)
│       ├── dodoLicenseVerifier.ts     # DodoPayments verification
│       └── gumroadLicenseVerifier.ts  # Existing Gumroad verification
└── components/
    ├── PricingModal.tsx               # Pricing display and plan selection
    ├── CheckoutButton.tsx             # Initiates checkout flow
    ├── SubscriptionStatus.tsx         # Shows subscription details
    └── PaymentProviderBadge.tsx       # Indicates active provider

lambdas/src/
├── dodoWebhook.ts                     # Webhook handler for payment events
└── utils/
    └── dodoWebhookVerifier.ts         # Webhook signature verification
```

### Data Flow

```
User Action → Checkout Manager → DodoPayments API → Hosted Checkout
                                                            ↓
                                                      Payment Success
                                                            ↓
                                                      License Key
                                                            ↓
Return URL → License Verifier → localStorage → Premium Access

Webhook → Lambda → Signature Verification → Database Update → License Status
```

## Components and Interfaces

### 1. DodoPaymentsClient

**Purpose**: Manages communication with DodoPayments API

**Interface**:
```typescript
interface DodoPaymentsConfig {
  apiKey: string
  apiUrl: string
  productId: string
  webhookSecret: string
}

interface CheckoutSession {
  sessionId: string
  checkoutUrl: string
  expiresAt: Date
}

interface LicenseVerificationResponse {
  valid: boolean
  licenseKey: string
  customerId: string
  productId: string
  purchaseType: 'one-time' | 'subscription'
  status: 'active' | 'expired' | 'cancelled' | 'refunded'
  expiresAt: Date | null
  metadata: Record<string, any>
}

interface SubscriptionDetails {
  subscriptionId: string
  customerId: string
  status: 'active' | 'cancelled' | 'past_due' | 'expired'
  currentPeriodStart: Date
  currentPeriodEnd: Date
  cancelAtPeriodEnd: boolean
  paymentMethod: {
    type: string
    last4: string
  }
}

class DodoPaymentsClient {
  constructor(config: DodoPaymentsConfig)
  
  async createCheckoutSession(
    planType: 'one-time' | 'subscription',
    successUrl: string,
    cancelUrl: string
  ): Promise<CheckoutSession>
  
  async verifyLicense(licenseKey: string): Promise<LicenseVerificationResponse>
  
  async getSubscriptionDetails(subscriptionId: string): Promise<SubscriptionDetails>
  
  async getCustomerPortalUrl(customerId: string): Promise<string>
  
  async cancelSubscription(subscriptionId: string): Promise<void>
}
```

**API Endpoints**:
- `POST /v1/checkout/sessions` - Create checkout session
- `POST /v1/licenses/verify` - Verify license key
- `GET /v1/subscriptions/:id` - Get subscription details
- `POST /v1/customer-portal` - Get customer portal URL
- `POST /v1/subscriptions/:id/cancel` - Cancel subscription

### 2. CheckoutManager

**Purpose**: Orchestrates the checkout flow and handles return from payment

**Interface**:
```typescript
interface CheckoutOptions {
  planType: 'one-time' | 'subscription'
  priceId: string
  metadata?: Record<string, any>
}

interface CheckoutResult {
  success: boolean
  licenseKey: string | null
  error: string | null
}

class CheckoutManager {
  constructor(dodoClient: DodoPaymentsClient)
  
  async initiateCheckout(options: CheckoutOptions): Promise<void>
  
  async handleCheckoutReturn(sessionId: string): Promise<CheckoutResult>
  
  async handleCheckoutCancel(): void
  
  private buildReturnUrls(): { success: string; cancel: string }
}
```

**Checkout Flow**:
1. User clicks "Upgrade to Premium"
2. CheckoutManager creates session with DodoPayments
3. User redirected to hosted checkout page
4. User completes payment
5. DodoPayments redirects to success URL with session ID
6. CheckoutManager extracts license key from session
7. License automatically verified and activated

### 3. SubscriptionManager

**Purpose**: Tracks subscription status and handles renewals

**Interface**:
```typescript
interface SubscriptionState {
  isSubscription: boolean
  subscriptionId: string | null
  status: 'active' | 'cancelled' | 'past_due' | 'expired' | null
  currentPeriodEnd: Date | null
  cancelAtPeriodEnd: boolean
  paymentMethod: string | null
}

class SubscriptionManager {
  constructor(dodoClient: DodoPaymentsClient, storage: PaymentStorage)
  
  async loadSubscription(licenseKey: string): Promise<SubscriptionState>
  
  async refreshSubscriptionStatus(): Promise<SubscriptionState>
  
  async openCustomerPortal(): Promise<void>
  
  async cancelSubscription(): Promise<void>
  
  getTimeUntilRenewal(): number | null
  
  isActive(): boolean
}
```

**Subscription Lifecycle**:
- Active: Full premium access
- Past Due: Grace period (3 days), access maintained
- Cancelled: Access until period end
- Expired: Reverted to free tier

### 4. Unified LicenseManager

**Purpose**: Manages both Gumroad and DodoPayments licenses

**Interface**:
```typescript
interface UnifiedLicenseStatus {
  isPremium: boolean
  provider: 'gumroad' | 'dodo' | null
  licenseKey: string | null
  isSubscription: boolean
  expiresAt: Date | null
  subscriptionStatus: string | null
}

class UnifiedLicenseManager {
  constructor(
    gumroadVerifier: GumroadLicenseVerifier,
    dodoVerifier: DodoLicenseVerifier
  )
  
  async verifyLicense(licenseKey: string, provider?: 'gumroad' | 'dodo'): Promise<UnifiedLicenseStatus>
  
  async checkSavedLicense(): Promise<UnifiedLicenseStatus>
  
  async refreshLicenseStatus(): Promise<UnifiedLicenseStatus>
  
  getStatus(): UnifiedLicenseStatus
  
  isPremium(): boolean
  
  getProvider(): 'gumroad' | 'dodo' | null
}
```

**Provider Detection**:
- Check localStorage for saved provider
- If provider specified, use that verifier
- If not specified, try DodoPayments first (primary)
- Fall back to Gumroad if Dodo verification fails
- Cache successful provider for future checks

### 5. DodoWebhook Handler (Lambda)

**Purpose**: Processes webhook events from DodoPayments

**Interface**:
```typescript
interface WebhookEvent {
  id: string
  type: 'payment.succeeded' | 'subscription.created' | 'subscription.updated' | 
        'subscription.cancelled' | 'subscription.renewed' | 'refund.created'
  data: {
    licenseKey: string
    customerId: string
    subscriptionId?: string
    status?: string
    metadata: Record<string, any>
  }
  timestamp: number
  signature: string
}

interface WebhookResponse {
  received: boolean
  processed: boolean
  error?: string
}

async function handleDodoWebhook(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult>

function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean

async function processWebhookEvent(event: WebhookEvent): Promise<void>
```

**Webhook Events**:
- `payment.succeeded`: New purchase, activate license
- `subscription.created`: New subscription, activate license
- `subscription.renewed`: Renewal successful, extend access
- `subscription.updated`: Status change, update license
- `subscription.cancelled`: Cancellation, mark for expiration
- `refund.created`: Refund issued, revoke license

## Data Models

### DodoLicense

```typescript
interface DodoLicense {
  licenseKey: string
  customerId: string
  productId: string
  purchaseType: 'one-time' | 'subscription'
  status: 'active' | 'expired' | 'cancelled' | 'refunded'
  subscriptionId: string | null
  createdAt: Date
  expiresAt: Date | null
  lastVerified: Date
  metadata: {
    email: string | null
    purchaseDate: Date
    amount: number
    currency: string
  }
}
```

### PaymentStorage Schema

```typescript
interface StoredPaymentData {
  provider: 'gumroad' | 'dodo'
  licenseKey: string
  customerId: string | null
  subscriptionId: string | null
  purchaseType: 'one-time' | 'subscription'
  verifiedAt: number
  expiresAt: number | null
}

// localStorage key: 'caption-art-payment'
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Prework Analysis

Let me analyze each acceptance criterion for testability:

**Requirement 1: Purchase through DodoPayments**

1.1 WHEN a user clicks upgrade to premium THEN the License Verification System SHALL initiate a DodoPayments checkout session
Thoughts: This is testing a UI interaction that triggers an API call. We can test that clicking the button calls the checkout creation function with correct parameters.
Testable: yes - property

1.2 WHEN the checkout session is created THEN the License Verification System SHALL redirect the user to the DodoPayments hosted checkout page
Thoughts: This tests that after session creation, a redirect occurs. We can verify the redirect URL is set correctly.
Testable: yes - property

1.3 WHEN the payment completes successfully THEN the DodoPayments API SHALL return a license key
Thoughts: This is testing the API behavior. We can mock the API and verify it returns a license key on success.
Testable: yes - property

1.4 WHEN the user returns from checkout THEN the License Verification System SHALL automatically verify and activate the license
Thoughts: This tests the return flow. We can simulate a return with a session ID and verify activation occurs.
Testable: yes - property

1.5 WHEN the checkout is cancelled THEN the License Verification System SHALL return the user to the application without changes
Thoughts: This tests cancellation handling. We can verify no license is saved and state is unchanged.
Testable: yes - property

**Requirement 2: One-time vs Subscription**

2.1 WHEN viewing pricing options THEN the License Verification System SHALL display both one-time and subscription plans
Thoughts: This is a UI rendering test. We can verify both plan types are present in the rendered output.
Testable: yes - example

2.2 WHEN a user selects one-time purchase THEN the License Verification System SHALL create a checkout session for lifetime access
Thoughts: This tests that selecting one-time creates the correct session type. We can verify the API is called with purchaseType: 'one-time'.
Testable: yes - property

2.3 WHEN a user selects subscription THEN the License Verification System SHALL create a checkout session for recurring billing
Thoughts: This tests that selecting subscription creates the correct session type. We can verify the API is called with purchaseType: 'subscription'.
Testable: yes - property

2.4 WHEN a subscription is active THEN the License Verification System SHALL verify the subscription status on each session
Thoughts: This tests that subscriptions are re-verified. We can test that loading the app with a subscription triggers verification.
Testable: yes - property

2.5 WHEN a subscription expires or is cancelled THEN the License Verification System SHALL revert the user to free tier
Thoughts: This tests status changes. We can verify that expired/cancelled status results in isPremium: false.
Testable: yes - property

**Requirement 3: Automatic verification**

3.1 WHEN a purchase completes THEN the DodoPayments API SHALL generate a unique license key
Thoughts: This tests API behavior. We can verify the API returns a unique key for each purchase.
Testable: yes - property

3.2 WHEN the user returns from checkout THEN the License Verification System SHALL extract the license key from the URL or session
Thoughts: This tests URL parsing. We can verify keys are correctly extracted from various URL formats.
Testable: yes - property

3.3 WHEN a license key is obtained THEN the License Verification System SHALL verify it with the DodoPayments API
Thoughts: This tests that obtaining a key triggers verification. We can verify the verification API is called.
Testable: yes - property

3.4 WHEN verification succeeds THEN the License Verification System SHALL store the license key in localStorage
Thoughts: This is a round-trip property. We can verify that after verification, the key can be retrieved from localStorage.
Testable: yes - property

3.5 WHEN verification fails THEN the License Verification System SHALL display an error and provide support contact information
Thoughts: This tests error handling. We can verify failed verification shows an error message.
Testable: yes - property

**Requirement 4: Manual license entry**

4.1 WHEN a user enters a license key THEN the License Verification System SHALL validate the format
Thoughts: This tests input validation. We can generate various formats and verify validation logic.
Testable: yes - property

4.2 WHEN the format is valid THEN the License Verification System SHALL call the DodoPayments verification API
Thoughts: This tests that valid format triggers API call. We can verify the API is called for valid inputs.
Testable: yes - property

4.3 WHEN the API responds THEN the License Verification System SHALL parse the verification result
Thoughts: This tests response parsing. We can verify various API responses are parsed correctly.
Testable: yes - property

4.4 WHEN verification succeeds THEN the License Verification System SHALL store the license key and enable premium access
Thoughts: This tests successful verification flow. We can verify storage and premium status are updated.
Testable: yes - property

4.5 WHEN verification fails THEN the License Verification System SHALL display an appropriate error message
Thoughts: This tests error display. We can verify different failure types show appropriate messages.
Testable: yes - property

**Requirement 5: License persistence**

5.1 WHEN the application loads THEN the License Verification System SHALL check localStorage for a saved DodoPayments license
Thoughts: This tests initialization. We can verify localStorage is checked on load.
Testable: yes - property

5.2 WHEN a saved license exists THEN the License Verification System SHALL verify it with the DodoPayments API
Thoughts: This tests that saved licenses are re-verified. We can verify the API is called for saved licenses.
Testable: yes - property

5.3 WHEN the saved license is valid THEN the License Verification System SHALL enable premium access automatically
Thoughts: This tests automatic activation. We can verify valid saved licenses enable premium.
Testable: yes - property

5.4 WHEN the saved license is invalid or expired THEN the License Verification System SHALL clear it and show free tier
Thoughts: This tests cleanup of invalid licenses. We can verify invalid licenses are removed and free tier is shown.
Testable: yes - property

5.5 WHEN a user logs out THEN the License Verification System SHALL remove the license key from localStorage
Thoughts: This tests logout cleanup. We can verify logout removes the license from storage.
Testable: yes - property

**Requirement 6: Subscription management**

6.1 WHEN a subscription user clicks manage subscription THEN the License Verification System SHALL redirect to the DodoPayments customer portal
Thoughts: This tests portal access. We can verify the correct portal URL is opened.
Testable: yes - property

6.2 WHEN in the customer portal THEN the DodoPayments API SHALL allow updating payment methods
Thoughts: This is testing external portal functionality, not our system.
Testable: no

6.3 WHEN in the customer portal THEN the DodoPayments API SHALL allow cancelling the subscription
Thoughts: This is testing external portal functionality, not our system.
Testable: no

6.4 WHEN a subscription is cancelled THEN the DodoPayments API SHALL continue access until the end of the billing period
Thoughts: This tests grace period logic. We can verify cancelled subscriptions remain active until period end.
Testable: yes - property

6.5 WHEN the billing period ends THEN the License Verification System SHALL revert the user to free tier
Thoughts: This tests expiration handling. We can verify expired subscriptions revert to free tier.
Testable: yes - property

**Requirement 7: Pricing information**

7.1-7.5: All are UI display requirements
Thoughts: These test what information is displayed in the pricing UI.
Testable: yes - example (for each)

**Requirement 8: Error messages**

8.1-8.5: All are error message display requirements
Thoughts: These test that specific error conditions show specific messages.
Testable: yes - example (for each)

**Requirement 9: Webhook integration**

9.1 WHEN a payment succeeds THEN the DodoPayments API SHALL send a webhook to the backend
Thoughts: This tests webhook delivery. We can verify our endpoint receives the webhook.
Testable: yes - property

9.2 WHEN a subscription renews THEN the DodoPayments API SHALL send a webhook to the backend
Thoughts: This tests renewal webhooks. We can verify renewal events are received.
Testable: yes - property

9.3 WHEN a subscription is cancelled THEN the DodoPayments API SHALL send a webhook to the backend
Thoughts: This tests cancellation webhooks. We can verify cancellation events are received.
Testable: yes - property

9.4 WHEN a refund is issued THEN the DodoPayments API SHALL send a webhook to the backend
Thoughts: This tests refund webhooks. We can verify refund events are received.
Testable: yes - property

9.5 WHEN a webhook is received THEN the backend SHALL verify the webhook signature and update license status
Thoughts: This tests webhook processing. We can verify signatures are checked and status is updated.
Testable: yes - property

**Requirement 10: Gumroad compatibility**

10.1 WHEN a user has a Gumroad license THEN the License Verification System SHALL continue to verify it with the Gumroad API
Thoughts: This tests backward compatibility. We can verify Gumroad licenses still work.
Testable: yes - property

10.2 WHEN both Gumroad and DodoPayments licenses exist THEN the License Verification System SHALL accept either as valid
Thoughts: This tests dual license support. We can verify either provider grants premium access.
Testable: yes - property

10.3 WHEN displaying license status THEN the License Verification System SHALL indicate which provider is active
Thoughts: This tests provider display. We can verify the correct provider is shown.
Testable: yes - property

10.4 WHEN a Gumroad license is valid THEN the License Verification System SHALL provide the same premium features as DodoPayments
Thoughts: This tests feature parity. We can verify both providers grant the same features.
Testable: yes - property

10.5 WHEN new users visit THEN the License Verification System SHALL default to showing DodoPayments as the primary payment option
Thoughts: This tests default UI state. We can verify DodoPayments is shown first.
Testable: yes - example

**Requirement 11: Security**

11.1-11.5: These are security requirements about how data is handled
Thoughts: These are implementation constraints, not functional requirements we can test with properties.
Testable: no

**Requirement 12: Purchase history**

12.1-12.5: These test external portal functionality
Thoughts: These are testing DodoPayments portal features, not our system.
Testable: no

### Property Reflection

After reviewing all properties, I'll identify redundancies:

- Properties 1.4 and 3.3 both test automatic verification after checkout - can be combined
- Properties 2.4 and 5.2 both test re-verification of saved licenses - can be combined
- Properties 4.4 and 3.4 both test storing license after verification - can be combined
- Properties 2.5, 5.4, and 6.5 all test reverting to free tier on expiration - can be combined
- Webhook properties 9.1-9.4 can be combined into one property about webhook delivery
- Error message properties 8.1-8.5 are examples, not properties

### Correctness Properties

Property 1: Checkout session creation
*For any* plan type (one-time or subscription), clicking upgrade should create a checkout session with the correct purchase type and redirect to the DodoPayments checkout URL
**Validates: Requirements 1.1, 1.2, 2.2, 2.3**

Property 2: Automatic license activation
*For any* successful checkout return, the system should extract the license key, verify it with the API, and enable premium access
**Validates: Requirements 1.4, 3.2, 3.3, 3.4**

Property 3: License persistence round-trip
*For any* valid license that is saved, after reloading the application, the license should be automatically verified and premium access should be enabled
**Validates: Requirements 5.1, 5.2, 5.3**

Property 4: Invalid license cleanup
*For any* invalid or expired license in localStorage, loading the application should clear the license and revert to free tier
**Validates: Requirements 5.4, 2.5, 6.5**

Property 5: Manual license verification
*For any* manually entered license key with valid format, the system should verify it with the API and enable premium access if valid
**Validates: Requirements 4.1, 4.2, 4.3, 4.4**

Property 6: Subscription status tracking
*For any* active subscription, loading the application should verify the subscription status and maintain premium access if still active
**Validates: Requirements 2.4, 5.2**

Property 7: Subscription grace period
*For any* cancelled subscription, premium access should continue until the current billing period ends
**Validates: Requirements 6.4**

Property 8: Webhook signature verification
*For any* webhook received, the system should verify the signature before processing the event
**Validates: Requirements 9.5**

Property 9: Webhook event processing
*For any* valid webhook event (payment, renewal, cancellation, refund), the system should update the license status accordingly
**Validates: Requirements 9.1, 9.2, 9.3, 9.4**

Property 10: Dual provider support
*For any* user with either a Gumroad or DodoPayments license, the system should grant premium access and indicate the active provider
**Validates: Requirements 10.1, 10.2, 10.3, 10.4**

Property 11: Checkout cancellation
*For any* cancelled checkout, the system should return to the application without saving any license data or changing access level
**Validates: Requirements 1.5**

Property 12: License format validation
*For any* license key input, invalid formats should be rejected before making API calls
**Validates: Requirements 4.1**

## Error Handling

### DodoPayments API Errors

**Connection Failures**:
- Retry up to 2 times with exponential backoff
- Display: "Unable to connect to payment service. Please check your connection."
- Allow manual retry

**Invalid License Key**:
- Display: "Invalid license key. Please check and try again."
- Clear input field
- Provide link to support

**Expired Subscription**:
- Display: "Your subscription has expired. Please renew to continue premium access."
- Show renewal button
- Link to customer portal

**Cancelled Subscription**:
- Display: "Your subscription is cancelled. Access will continue until [end date]."
- Show reactivation option
- Link to customer portal

**Refunded Purchase**:
- Display: "This license has been refunded and is no longer valid."
- Remove from localStorage
- Revert to free tier

**Rate Limiting**:
- Display: "Too many requests. Please try again in a few moments."
- Disable verify button temporarily
- Show countdown timer

**API Unavailable**:
- Display: "Payment service temporarily unavailable. Please try again later."
- If saved license exists, allow temporary access with warning

### Checkout Errors

**Payment Failed**:
- Display: "Payment failed. Please try again or use a different payment method."
- Return to pricing page
- Preserve plan selection

**Session Expired**:
- Display: "Checkout session expired. Please start again."
- Return to pricing page

**Invalid Session**:
- Display: "Invalid checkout session. Please contact support."
- Provide support email

### Webhook Errors

**Invalid Signature**:
- Log error
- Return 401 Unauthorized
- Do not process event

**Unknown Event Type**:
- Log warning
- Return 200 OK (acknowledge receipt)
- Do not process event

**Processing Failure**:
- Log error with full context
- Return 500 Internal Server Error
- DodoPayments will retry

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
- Log error for debugging

## Testing Strategy

### Unit Tests

**DodoPaymentsClient**:
- Test API request formatting
- Test response parsing
- Test error handling
- Test retry logic

**CheckoutManager**:
- Test checkout initiation
- Test return URL handling
- Test session ID extraction
- Test cancellation handling

**SubscriptionManager**:
- Test subscription loading
- Test status refresh
- Test portal URL generation
- Test cancellation flow

**UnifiedLicenseManager**:
- Test provider detection
- Test dual license support
- Test provider fallback
- Test status aggregation

**DodoWebhook Handler**:
- Test signature verification
- Test event parsing
- Test event processing
- Test error responses

### Property-Based Tests

The property-based testing library for this project is **fast-check** (JavaScript/TypeScript).

Each property-based test should run a minimum of 100 iterations.

**Property 1: Checkout session creation**
- Generate random plan types
- Trigger checkout
- Verify session created with correct type
- Verify redirect URL is valid

**Property 2: Automatic license activation**
- Generate random session IDs
- Mock successful checkout return
- Verify license extracted and verified
- Verify premium access enabled

**Property 3: License persistence round-trip**
- Generate random valid licenses
- Save to localStorage
- Reload application
- Verify license still valid and premium active

**Property 4: Invalid license cleanup**
- Generate random invalid/expired licenses
- Save to localStorage
- Reload application
- Verify license cleared and free tier active

**Property 5: Manual license verification**
- Generate random valid license keys
- Enter manually
- Verify API called
- Verify premium enabled if valid

**Property 6: Subscription status tracking**
- Generate random subscription states
- Load application
- Verify status checked
- Verify access matches status

**Property 7: Subscription grace period**
- Generate cancelled subscriptions
- Check access before period end
- Verify premium still active
- Check after period end
- Verify reverted to free tier

**Property 8: Webhook signature verification**
- Generate random webhook payloads
- Generate valid and invalid signatures
- Verify valid signatures accepted
- Verify invalid signatures rejected

**Property 9: Webhook event processing**
- Generate random webhook events
- Process each type
- Verify license status updated correctly

**Property 10: Dual provider support**
- Generate Gumroad and Dodo licenses
- Test with each provider
- Verify both grant premium
- Verify provider indicated correctly

**Property 11: Checkout cancellation**
- Simulate checkout cancellation
- Verify no license saved
- Verify access level unchanged

**Property 12: License format validation**
- Generate random strings (valid and invalid)
- Attempt validation
- Verify invalid formats rejected
- Verify no API calls for invalid formats

### Integration Tests

**Full Checkout Flow**:
- Click upgrade button
- Create checkout session
- Simulate payment completion
- Return with session ID
- Verify license activated
- Verify premium access granted

**Subscription Lifecycle**:
- Purchase subscription
- Verify active status
- Simulate renewal
- Verify status updated
- Simulate cancellation
- Verify grace period
- Simulate expiration
- Verify reverted to free tier

**Webhook Processing**:
- Send webhook to Lambda
- Verify signature checked
- Verify event processed
- Verify license status updated
- Verify response sent

**Provider Migration**:
- Start with Gumroad license
- Add DodoPayments license
- Verify both work
- Remove Gumroad license
- Verify DodoPayments still works

**Error Recovery**:
- Simulate API failures
- Verify retry logic
- Verify error messages
- Verify graceful degradation

## Implementation Notes

### DodoPayments API Integration

**Checkout Session Creation**:
```typescript
async function createCheckoutSession(
  planType: 'one-time' | 'subscription',
  priceId: string
): Promise<CheckoutSession> {
  const response = await fetch('https://api.dodopayments.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${DODO_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      price_id: priceId,
      success_url: `${window.location.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${window.location.origin}/checkout/cancel`,
      metadata: {
        app: 'caption-art',
        version: '1.0'
      }
    })
  })
  
  if (!response.ok) {
    throw new Error('Failed to create checkout session')
  }
  
  return await response.json()
}
```

**License Verification**:
```typescript
async function verifyLicense(licenseKey: string): Promise<LicenseVerificationResponse> {
  const response = await fetch('https://api.dodopayments.com/v1/licenses/verify', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${DODO_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      license_key: licenseKey
    })
  })
  
  if (!response.ok) {
    throw new Error('License verification failed')
  }
  
  const data = await response.json()
  
  return {
    valid: data.valid && data.status === 'active',
    licenseKey: data.license_key,
    customerId: data.customer_id,
    productId: data.product_id,
    purchaseType: data.purchase_type,
    status: data.status,
    expiresAt: data.expires_at ? new Date(data.expires_at) : null,
    metadata: data.metadata
  }
}
```

### Webhook Handler Implementation

```typescript
export async function handleDodoWebhook(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const signature = event.headers['x-dodo-signature']
  const payload = event.body
  
  // Verify signature
  if (!verifyWebhookSignature(payload, signature, WEBHOOK_SECRET)) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Invalid signature' })
    }
  }
  
  const webhookEvent = JSON.parse(payload)
  
  try {
    await processWebhookEvent(webhookEvent)
    
    return {
      statusCode: 200,
      body: JSON.stringify({ received: true })
    }
  } catch (error) {
    console.error('Webhook processing error:', error)
    
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Processing failed' })
    }
  }
}

function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const crypto = require('crypto')
  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(payload)
  const expectedSignature = hmac.digest('hex')
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}

async function processWebhookEvent(event: WebhookEvent): Promise<void> {
  switch (event.type) {
    case 'payment.succeeded':
    case 'subscription.created':
      // Activate license
      await activateLicense(event.data.licenseKey, event.data)
      break
      
    case 'subscription.renewed':
      // Extend license
      await extendLicense(event.data.licenseKey, event.data)
      break
      
    case 'subscription.cancelled':
      // Mark for expiration
      await markLicenseCancelled(event.data.licenseKey, event.data)
      break
      
    case 'refund.created':
      // Revoke license
      await revokeLicense(event.data.licenseKey)
      break
      
    default:
      console.warn(`Unknown webhook event type: ${event.type}`)
  }
}
```

### localStorage Schema

**Payment Data Storage**:
```typescript
interface StoredPaymentData {
  provider: 'gumroad' | 'dodo'
  licenseKey: string
  customerId: string | null
  subscriptionId: string | null
  purchaseType: 'one-time' | 'subscription'
  verifiedAt: number
  expiresAt: number | null
}

// Save
localStorage.setItem('caption-art-payment', JSON.stringify(paymentData))

// Load
const stored = localStorage.getItem('caption-art-payment')
const paymentData = stored ? JSON.parse(stored) : null
```

### Security Considerations

**API Key Management**:
- Store DodoPayments API key in environment variables
- Never expose in client-side code
- Use backend proxy for sensitive operations
- Rotate keys periodically

**Webhook Security**:
- Always verify webhook signatures
- Use timing-safe comparison for signatures
- Log all webhook attempts
- Rate limit webhook endpoint

**License Key Storage**:
- License keys are not highly sensitive
- localStorage is acceptable for client-side storage
- Re-verify periodically (every 7 days)
- Clear on logout

**Payment Data**:
- Never store credit card information
- All payment processing handled by DodoPayments
- Only store license keys and metadata
- Use HTTPS for all communications

### Performance Optimization

- Cache verification results for 7 days
- Lazy load DodoPayments SDK
- Debounce license input validation
- Prefetch verification on app load
- Use Web Workers for webhook processing (if needed)
- Batch webhook events if multiple arrive simultaneously

### Browser Compatibility

- Use `fetch` API (widely supported)
- Polyfill `crypto.subtle` for older browsers
- Handle localStorage unavailability gracefully
- Test in Chrome, Firefox, Safari, Edge
- Test on mobile browsers (iOS Safari, Chrome Mobile)

### Accessibility

- Announce verification status to screen readers
- Provide loading indicators
- Use semantic HTML for forms
- Ensure keyboard navigation works
- Provide clear error messages
- Use ARIA labels for dynamic content

### User Experience

- Auto-verify saved license on load
- Show verification progress
- Provide clear upgrade prompts
- Display subscription status prominently
- Make customer portal easily accessible
- Provide easy license removal option
- Show time until renewal for subscriptions
- Indicate which provider is active (Gumroad vs Dodo)
