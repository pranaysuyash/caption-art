# Requirements Document

## Introduction

This document outlines the requirements for the License and Paywall System, which manages user access to premium features through Gumroad license verification, enforces free tier limitations, and controls watermark application on exports.

## Glossary

- **License Verification System**: The service that validates Gumroad license keys and manages user access levels
- **Gumroad API**: The third-party service for validating product purchases and license keys
- **Premium Access**: Full access to unwatermarked exports with no daily limits
- **Free Tier**: Limited access with watermarked exports and 2 exports per day maximum
- **License Key**: A unique alphanumeric string provided by Gumroad upon purchase
- **Watermark**: A semi-transparent overlay applied to exported images indicating free tier usage
- **Export Quota**: The number of remaining exports available in the current day for free tier users
- **Local Storage**: Browser-based persistent storage for license keys and export tracking

## Requirements

### Requirement 1

**User Story:** As a user, I want to enter my license key, so that I can unlock premium features after purchasing.

#### Acceptance Criteria

1. WHEN a user enters a license key THEN the License Verification System SHALL validate the format is alphanumeric
2. WHEN the license key format is valid THEN the License Verification System SHALL call the Gumroad Verify API
3. WHEN the Gumroad API responds THEN the License Verification System SHALL parse the verification result
4. WHEN verification succeeds THEN the License Verification System SHALL store the license key in localStorage
5. WHEN verification fails THEN the License Verification System SHALL display an error message and clear the input field

### Requirement 2

**User Story:** As a user, I want my license to be remembered, so that I don't have to re-enter it every time I use the application.

#### Acceptance Criteria

1. WHEN the application loads THEN the License Verification System SHALL check localStorage for a saved license key
2. WHEN a saved license key exists THEN the License Verification System SHALL verify it with the Gumroad API
3. WHEN the saved license is valid THEN the License Verification System SHALL enable premium access automatically
4. WHEN the saved license is invalid THEN the License Verification System SHALL clear it from localStorage and show free tier
5. WHEN a user logs out THEN the License Verification System SHALL remove the license key from localStorage

### Requirement 3

**User Story:** As a premium user, I want unlimited unwatermarked exports, so that I can create professional caption art without restrictions.

#### Acceptance Criteria

1. WHEN a premium user exports an image THEN the License Verification System SHALL allow the export without applying a watermark
2. WHEN a premium user exports multiple images THEN the License Verification System SHALL not enforce any daily limits
3. WHEN premium access is active THEN the License Verification System SHALL display a "Premium" badge in the UI
4. WHEN a premium user's license expires THEN the License Verification System SHALL revert to free tier access
5. WHEN exporting with premium access THEN the License Verification System SHALL generate the filename without watermark suffix

### Requirement 4

**User Story:** As a free tier user, I want to try the application with limited exports, so that I can evaluate it before purchasing.

#### Acceptance Criteria

1. WHEN a free tier user exports an image THEN the License Verification System SHALL apply a watermark to the bottom-right corner
2. WHEN a free tier user exports an image THEN the License Verification System SHALL decrement the daily export quota
3. WHEN the daily quota reaches zero THEN the License Verification System SHALL disable the export button
4. WHEN the daily quota is exhausted THEN the License Verification System SHALL display a message encouraging license purchase
5. WHEN a new day begins THEN the License Verification System SHALL reset the export quota to 2

### Requirement 5

**User Story:** As a free tier user, I want to see how many exports I have remaining, so that I can plan my usage accordingly.

#### Acceptance Criteria

1. WHEN the application loads THEN the License Verification System SHALL display the remaining export count
2. WHEN an export completes THEN the License Verification System SHALL update the displayed count immediately
3. WHEN the quota is exhausted THEN the License Verification System SHALL display "0 exports remaining today"
4. WHEN the quota resets THEN the License Verification System SHALL update the display to show 2 available exports
5. WHEN premium access is active THEN the License Verification System SHALL display "Unlimited exports" instead of a count

### Requirement 6

**User Story:** As a user, I want clear visual indication of my access level, so that I understand what features are available to me.

#### Acceptance Criteria

1. WHEN free tier is active THEN the License Verification System SHALL display a "Free Tier" badge
2. WHEN premium access is active THEN the License Verification System SHALL display a "Premium" badge with distinct styling
3. WHEN the license is being verified THEN the License Verification System SHALL display a loading indicator
4. WHEN verification fails THEN the License Verification System SHALL display an error state with retry option
5. WHEN hovering over the badge THEN the License Verification System SHALL show a tooltip with access details

### Requirement 7

**User Story:** As a user, I want meaningful error messages during license verification, so that I can resolve issues quickly.

#### Acceptance Criteria

1. WHEN the license key is invalid THEN the License Verification System SHALL display "Invalid license key. Please check and try again."
2. WHEN the license is refunded THEN the License Verification System SHALL display "This license has been refunded and is no longer valid."
3. WHEN the license is chargebacked THEN the License Verification System SHALL display "This license is no longer valid."
4. WHEN the Gumroad API is unreachable THEN the License Verification System SHALL display "Unable to verify license. Please check your connection."
5. WHEN API rate limits are hit THEN the License Verification System SHALL display "Too many verification attempts. Please try again later."

### Requirement 8

**User Story:** As a user, I want the watermark to be visible but not overly intrusive, so that I can evaluate the output quality while understanding it's a free tier export.

#### Acceptance Criteria

1. WHEN applying a watermark THEN the License Verification System SHALL position it in the bottom-right corner with 20px padding
2. WHEN applying a watermark THEN the License Verification System SHALL use 40% opacity for subtle visibility
3. WHEN applying a watermark THEN the License Verification System SHALL use white text with a dark shadow for readability on any background
4. WHEN applying a watermark THEN the License Verification System SHALL include the text "Caption Art - Free Tier"
5. WHEN exporting THEN the License Verification System SHALL render the watermark as part of the final canvas composite
