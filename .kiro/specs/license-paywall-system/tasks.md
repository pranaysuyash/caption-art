# Implementation Plan - License and Paywall System

- [x] 1. Set up license library structure
- [x] 1.1 Create license module directory structure
  - Create `frontend/src/lib/license/` directory
  - Create subdirectories for clients and utilities
  - _Requirements: All_

- [x] 1.2 Create core interfaces and types
  - Define LicenseStatus interface
  - Define VerificationResult interface
  - Define LicenseState interface
  - Define AccessLevel type
  - Define AccessFeatures interface
  - _Requirements: 1.1, 2.1, 3.1, 4.1_

- [ ] 2. Implement GumroadClient
- [ ] 2.1 Create gumroadClient.ts
  - Define GumroadPurchase interface
  - Implement constructor with product permalink and access token
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 2.2 Implement verifyLicense function
  - Call Gumroad Verify API
  - Pass product_permalink and license_key
  - Parse response
  - Return GumroadPurchase
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 2.3 Implement isValidPurchase function
  - Check success === true
  - Check refunded === false
  - Check chargebacked === false
  - Check disputed === false OR dispute_won === true
  - Return boolean
  - _Requirements: 1.5, 7.2, 7.3_

- [ ] 2.4 Implement error handling
  - Handle connection failures with retry
  - Handle rate limiting
  - Handle invalid license keys
  - Parse error responses
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 2.5 Write property test for refunded license rejection
  - **Property 2: Refunded license rejection**
  - **Validates: Requirements 1.5, 7.2**

- [ ] 2.6 Write property test for chargebacked license rejection
  - **Property 3: Chargebacked license rejection**
  - **Validates: Requirements 1.5, 7.3**

- [ ] 3. Implement LicenseStorage
- [ ] 3.1 Create licenseStorage.ts
  - Define StoredLicense interface
  - Implement constructor with storage key
  - _Requirements: 2.1, 2.2, 2.3_

- [ ] 3.2 Implement save function
  - Serialize license to JSON
  - Save to localStorage
  - Handle storage unavailable
  - _Requirements: 2.2_

- [ ] 3.3 Implement load function
  - Load from localStorage
  - Parse JSON
  - Return StoredLicense or null
  - Handle corrupted data
  - _Requirements: 2.3_

- [ ] 3.4 Implement remove function
  - Remove from localStorage
  - _Requirements: 2.5_

- [ ] 3.5 Implement isExpired function
  - Check if verifiedAt is older than 7 days
  - Return boolean
  - _Requirements: 2.4_

- [ ] 3.6 Write property test for license persistence round-trip
  - **Property 1: License persistence round-trip**
  - **Validates: Requirements 2.1, 2.2, 2.3**

- [ ] 4. Implement ExportQuota
- [ ] 4.1 Create exportQuota.ts
  - Define QuotaState interface
  - Implement constructor with daily limit (2)
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 4.2 Implement getRemainingExports function
  - Check and reset if needed
  - Return remaining count
  - _Requirements: 5.1, 5.2_

- [ ] 4.3 Implement canExport function
  - Check if remaining > 0
  - Return boolean
  - _Requirements: 4.3_

- [ ] 4.4 Implement consumeExport function
  - Check if can export
  - Decrement remaining
  - Save to localStorage
  - Return success boolean
  - _Requirements: 4.2_

- [ ] 4.5 Implement reset function
  - Set remaining to daily limit
  - Set resetAt to next midnight
  - Save to localStorage
  - _Requirements: 4.5_

- [ ] 4.6 Implement getResetTime function
  - Return Date of next reset
  - _Requirements: 5.4_

- [ ] 4.7 Implement checkAndResetIfNeeded function
  - Check if current time >= resetAt
  - Call reset if needed
  - _Requirements: 4.5_

- [ ] 4.8 Write property test for free tier quota enforcement
  - **Property 5: Free tier quota enforcement**
  - **Validates: Requirements 4.2, 4.3**

- [ ] 4.9 Write property test for daily quota reset
  - **Property 6: Daily quota reset**
  - **Validates: Requirements 4.5**

- [ ] 5. Implement WatermarkRenderer
- [ ] 5.1 Create watermarkRenderer.ts
  - Define WatermarkConfig interface
  - Implement getDefaultConfig function
  - _Requirements: 4.1, 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 5.2 Implement apply function
  - Get canvas context
  - Set font, color, opacity
  - Add shadow for readability
  - Measure text
  - Calculate position (bottom-right with 20px padding)
  - Draw text
  - _Requirements: 4.1, 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 5.3 Write property test for watermark presence on free exports
  - **Property 7: Watermark presence on free exports**
  - **Validates: Requirements 4.1, 8.5**

- [ ] 5.4 Write property test for watermark absence on premium exports
  - **Property 8: Watermark absence on premium exports**
  - **Validates: Requirements 3.1, 3.5**

- [ ] 5.5 Write property test for watermark positioning accuracy
  - **Property 9: Watermark positioning accuracy**
  - **Validates: Requirements 8.1**

- [ ] 5.6 Write property test for watermark opacity consistency
  - **Property 10: Watermark opacity consistency**
  - **Validates: Requirements 8.2**

- [ ] 6. Implement LicenseManager
- [ ] 6.1 Create licenseManager.ts main class
  - Implement constructor with config
  - Initialize Gumroad client
  - Initialize license storage
  - Initialize export quota
  - _Requirements: All_

- [ ] 6.2 Implement verify function
  - Validate license key format
  - Call Gumroad client
  - Check if purchase is valid
  - Save license if valid
  - Return VerificationResult
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 6.3 Implement checkSavedLicense function
  - Load license from storage
  - Check if expired
  - Re-verify if expired
  - Return LicenseStatus
  - _Requirements: 2.1, 2.3, 2.4_

- [ ] 6.4 Implement saveLicense function
  - Create StoredLicense object
  - Save to storage
  - _Requirements: 2.2_

- [ ] 6.5 Implement removeLicense function
  - Remove from storage
  - Reset state to free tier
  - _Requirements: 2.5_

- [ ] 6.6 Implement getStatus function
  - Return current LicenseStatus
  - _Requirements: 6.1, 6.2_

- [ ] 6.7 Implement isPremium function
  - Check if license is valid
  - Return boolean
  - _Requirements: 3.1, 3.2, 3.3_

- [ ] 7. Create React components
- [ ] 7.1 Create LicenseInput component
  - Render input field for license key
  - Render verify button
  - Show loading state during verification
  - Display error messages
  - Apply neo-brutalism styling
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 7.2 Create AccessBadge component
  - Display "Premium" or "Free Tier" badge
  - Apply distinct styling for each
  - Show tooltip with access details
  - Apply neo-brutalism styling
  - _Requirements: 3.3, 6.1, 6.2_

- [ ] 7.3 Create ExportQuotaDisplay component
  - Display remaining export count for free tier
  - Display "Unlimited exports" for premium
  - Update on export
  - Apply neo-brutalism styling
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 7.4 Create UpgradePrompt component
  - Display when quota exhausted
  - Show upgrade CTA
  - Link to purchase page
  - Apply neo-brutalism styling
  - _Requirements: 4.4_

- [ ] 8. Integrate with App.tsx
- [ ] 8.1 Replace existing license logic
  - Import LicenseManager class
  - Initialize manager with Gumroad config
  - Check saved license on mount
  - _Requirements: 2.1, 2.3_

- [ ] 8.2 Add license input to UI
  - Add LicenseInput component
  - Handle verify button click
  - Update license state on success
  - Display error on failure
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 8.3 Add access badge to UI
  - Add AccessBadge component to header
  - Update badge on license change
  - _Requirements: 3.3, 6.1, 6.2_

- [ ] 8.4 Add quota display to UI
  - Add ExportQuotaDisplay component
  - Update on export
  - Hide for premium users
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 8.5 Add upgrade prompt
  - Show UpgradePrompt when quota exhausted
  - Hide for premium users
  - _Requirements: 4.4_

- [ ] 9. Integrate with export system
- [ ] 9.1 Check license before export
  - Check if premium or has quota
  - Block export if quota exhausted
  - _Requirements: 3.1, 3.2, 4.2, 4.3_

- [ ] 9.2 Apply watermark based on license
  - Apply watermark for free tier
  - Skip watermark for premium
  - _Requirements: 3.1, 4.1, 8.5_

- [ ] 9.3 Consume quota on export
  - Decrement quota for free tier
  - Skip for premium
  - Update quota display
  - _Requirements: 4.2, 5.2_

- [ ] 9.4 Update filename based on license
  - Add "-watermarked" suffix for free tier
  - Skip suffix for premium
  - _Requirements: 3.5, 4.1_

- [ ] 9.5 Write property test for premium export unlimited
  - **Property 4: Premium export unlimited**
  - **Validates: Requirements 3.2, 3.5**

- [ ] 10. Implement error handling
- [ ] 10.1 Handle Gumroad API errors
  - Catch connection failures
  - Handle invalid license keys
  - Handle refunded purchases
  - Handle chargebacked purchases
  - Handle rate limiting
  - Handle API unavailable
  - Display user-friendly messages
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 10.2 Handle localStorage errors
  - Handle storage unavailable
  - Handle storage full
  - Handle corrupted data
  - Fall back to in-memory storage
  - Display warnings
  - _Requirements: 2.2, 2.3_

- [ ] 10.3 Handle quota tracking errors
  - Detect clock skew
  - Handle corrupted quota data
  - Reset to safe defaults
  - Log warnings
  - _Requirements: 4.5_

- [ ] 11. Write property test for badge display accuracy
  - **Property 11: Badge display accuracy**
  - **Validates: Requirements 3.3, 6.1, 6.2**

- [ ] 12. Write property test for quota display accuracy
  - **Property 12: Quota display accuracy**
  - **Validates: Requirements 5.1, 5.2, 5.3**

- [ ] 13. Write property test for license format validation
  - **Property 13: License format validation**
  - **Validates: Requirements 1.1**

- [ ] 14. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 15. Write unit tests
- [ ] 15.1 Test LicenseManager
  - Test license verification flow
  - Test saved license loading
  - Test license removal
  - Test premium status check

- [ ] 15.2 Test GumroadClient
  - Test API request formatting
  - Test response parsing
  - Test validation logic (refunded, chargebacked)
  - Test error handling

- [ ] 15.3 Test LicenseStorage
  - Test save/load cycle
  - Test expiration checking
  - Test removal
  - Test corrupted data handling

- [ ] 15.4 Test ExportQuota
  - Test quota consumption
  - Test daily reset logic
  - Test remaining count calculation
  - Test exhaustion detection

- [ ] 15.5 Test WatermarkRenderer
  - Test watermark positioning
  - Test opacity application
  - Test text rendering
  - Test shadow rendering

- [ ] 16. Final testing
- [ ] 16.1 Test license verification
  - Test with valid license key
  - Test with invalid license key
  - Test with refunded license
  - Test with chargebacked license
  - Verify error messages are clear
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 7.1, 7.2, 7.3_

- [ ] 16.2 Test license persistence
  - Verify license on page load
  - Reload page
  - Verify still premium
  - Wait 7 days (simulate)
  - Verify re-verification occurs
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 16.3 Test quota system
  - Start with 2 exports
  - Export twice
  - Verify quota exhausted
  - Verify export blocked
  - Simulate day change
  - Verify quota reset
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 16.4 Test watermark
  - Export as free tier
  - Verify watermark present
  - Verify position correct
  - Verify opacity correct
  - Export as premium
  - Verify no watermark
  - _Requirements: 3.1, 4.1, 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 16.5 Test access levels
  - Verify free tier badge
  - Verify premium badge
  - Verify quota display for free
  - Verify unlimited for premium
  - _Requirements: 3.3, 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2_

- [ ] 17. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
