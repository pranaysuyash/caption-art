# Implementation Plan - DodoPayments Integration

- [ ] 1. Set up DodoPayments API client and configuration
  - Create DodoPaymentsClient class with API endpoint configuration
  - Implement environment variable handling for API keys
  - Set up TypeScript interfaces for API request/response types
  - Add error handling utilities for API failures
  - _Requirements: 1.1, 1.2, 3.1, 4.2_

- [ ] 1.1 Write property test for API client
  - **Property 1: Checkout session creation**
  - **Validates: Requirements 1.1, 1.2, 2.2, 2.3**

- [ ] 2. Implement checkout flow
  - [ ] 2.1 Create CheckoutManager class
    - Implement checkout session creation for one-time and subscription plans
    - Build return URL handling with session ID extraction
    - Add checkout cancellation handling
    - _Requirements: 1.1, 1.2, 1.5, 2.2, 2.3_

  - [ ] 2.2 Write property test for checkout session creation
    - **Property 1: Checkout session creation**
    - **Validates: Requirements 1.1, 1.2, 2.2, 2.3**

  - [ ] 2.3 Create CheckoutButton component
    - Build UI for initiating checkout
    - Add loading states during session creation
    - Implement redirect to DodoPayments hosted page
    - _Requirements: 1.1, 1.2_

  - [ ] 2.4 Implement checkout return handling
    - Parse session ID from return URL
    - Extract and verify license key
    - Automatically activate premium access
    - _Requirements: 1.4, 3.2, 3.3, 3.4_

  - [ ] 2.5 Write property test for automatic license activation
    - **Property 2: Automatic license activation**
    - **Validates: Requirements 1.4, 3.2, 3.3, 3.4**

- [ ] 3. Implement license verification system
  - [ ] 3.1 Create DodoLicenseVerifier class
    - Implement license verification API call
    - Add response parsing and validation
    - Handle verification errors
    - _Requirements: 3.3, 4.2, 4.3_

  - [ ] 3.2 Write property test for manual license verification
    - **Property 5: Manual license verification**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4**

  - [ ] 3.3 Implement license format validation
    - Add client-side format checking
    - Prevent API calls for invalid formats
    - _Requirements: 4.1_

  - [ ] 3.5 Write property test for license format validation
    - **Property 12: License format validation**
    - **Validates: Requirements 4.1**

  - [ ] 3.6 Create license input UI component
    - Build manual license entry form
    - Add validation feedback
    - Show verification progress
    - _Requirements: 4.1, 4.2, 4.5_

- [ ] 4. Implement unified license management
  - [ ] 4.1 Update UnifiedLicenseManager
    - Integrate DodoLicenseVerifier alongside GumroadLicenseVerifier
    - Implement provider detection logic
    - Add dual license support
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [ ] 4.2 Write property test for dual provider support
    - **Property 10: Dual provider support**
    - **Validates: Requirements 10.1, 10.2, 10.3, 10.4**

  - [ ] 4.3 Update PaymentStorage
    - Add provider field to stored data
    - Implement migration for existing Gumroad licenses
    - _Requirements: 10.1_

  - [ ] 4.4 Update license status UI
    - Display active provider (Gumroad or DodoPayments)
    - Show appropriate badge
    - _Requirements: 10.3_

- [ ] 5. Implement subscription management
  - [ ] 5.1 Create SubscriptionManager class
    - Implement subscription status loading
    - Add subscription refresh logic
    - Build customer portal URL generation
    - _Requirements: 2.4, 6.1_

  - [ ] 5.2 Write property test for subscription status tracking
    - **Property 6: Subscription status tracking**
    - **Validates: Requirements 2.4, 5.2**

  - [ ] 5.3 Create SubscriptionStatus component
    - Display subscription details (status, renewal date)
    - Show manage subscription button
    - Add cancellation warning
    - _Requirements: 6.1_

  - [ ] 5.4 Implement subscription grace period logic
    - Handle cancelled subscriptions
    - Maintain access until period end
    - _Requirements: 6.4_

  - [ ] 5.5 Write property test for subscription grace period
    - **Property 7: Subscription grace period**
    - **Validates: Requirements 6.4**

- [ ] 6. Implement license persistence
  - [ ] 6.1 Update license storage logic
    - Save DodoPayments licenses to localStorage
    - Implement auto-verification on app load
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ] 6.2 Write property test for license persistence
    - **Property 3: License persistence round-trip**
    - **Validates: Requirements 5.1, 5.2, 5.3**

  - [ ] 6.3 Implement invalid license cleanup
    - Clear expired/invalid licenses
    - Revert to free tier
    - _Requirements: 5.4, 2.5, 6.5_

  - [ ] 6.4 Write property test for invalid license cleanup
    - **Property 4: Invalid license cleanup**
    - **Validates: Requirements 5.4, 2.5, 6.5**

  - [ ] 6.5 Add logout license removal
    - Clear license on logout
    - _Requirements: 5.5_

- [ ] 7. Create pricing UI
  - [ ] 7.1 Create PricingModal component
    - Display one-time and subscription options
    - Show pricing and features
    - Add comparison table
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [ ] 7.2 Implement currency detection
    - Detect user location
    - Display appropriate currency
    - _Requirements: 7.5_

  - [ ] 7.3 Add upgrade prompts
    - Show upgrade CTA for free tier users
    - Display benefits of premium
    - _Requirements: 7.3_

- [ ] 8. Implement webhook handler (Lambda)
  - [ ] 8.1 Create dodoWebhook Lambda function
    - Set up API Gateway endpoint
    - Implement webhook signature verification
    - Add event parsing
    - _Requirements: 9.5_

  - [ ] 8.2 Write property test for webhook signature verification
    - **Property 8: Webhook signature verification**
    - **Validates: Requirements 9.5**

  - [ ] 8.3 Implement webhook event processing
    - Handle payment.succeeded events
    - Handle subscription.created events
    - Handle subscription.renewed events
    - Handle subscription.cancelled events
    - Handle refund.created events
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [ ] 8.4 Write property test for webhook event processing
    - **Property 9: Webhook event processing**
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.4**

  - [ ] 8.5 Add webhook error handling
    - Handle invalid signatures
    - Handle unknown event types
    - Implement retry logic
    - _Requirements: 9.5_

  - [ ] 8.6 Deploy webhook Lambda
    - Update CDK stack with new Lambda
    - Configure API Gateway
    - Set up environment variables
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 9. Implement error handling and user feedback
  - [ ] 9.1 Add error message display
    - Implement toast notifications for errors
    - Add specific error messages for each failure type
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ] 9.2 Add retry logic
    - Implement exponential backoff for API failures
    - Add manual retry buttons
    - _Requirements: 8.1, 8.4_

  - [ ] 9.3 Add loading states
    - Show spinners during verification
    - Display progress messages
    - _Requirements: 1.1, 3.3, 4.2_

- [ ] 10. Update existing components
  - [ ] 10.1 Update export functionality
    - Check DodoPayments premium status
    - Apply/skip watermark based on license
    - _Requirements: 3.1_

  - [ ] 10.2 Update access badge
    - Show DodoPayments or Gumroad provider
    - Display subscription status if applicable
    - _Requirements: 10.3_

  - [ ] 10.3 Update settings panel
    - Add license management section
    - Show current provider
    - Add logout/remove license option
    - _Requirements: 5.5, 6.1_

- [ ] 11. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 12. Integration testing
  - Test full checkout flow (one-time and subscription)
  - Test license verification flow
  - Test subscription management flow
  - Test webhook processing
  - Test Gumroad compatibility
  - Test error scenarios
  - _Requirements: All_

- [ ] 13. Documentation
  - Document DodoPayments API integration
  - Add setup instructions for API keys
  - Document webhook configuration
  - Add troubleshooting guide
  - _Requirements: All_
