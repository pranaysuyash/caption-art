# Requirements Document

## Introduction

This document outlines the requirements for integrating neo-brutalism design principles and enhanced UI/UX features from the `claude/improve-frontend-design` branch into the existing React-based Caption Art application while maintaining the AWS backend architecture and core functionality.

## Glossary

- **Caption Art Application**: The web application that generates AI-powered captions for uploaded images with text overlay capabilities
- **Neo-brutalism**: A design style characterized by bold borders, vibrant colors, strong shadows, and geometric shapes
- **React Frontend**: The existing TypeScript React single-page application
- **AWS Backend**: The Lambda-based API services for caption generation, masking, and license verification
- **Style Preset**: A predefined text styling configuration (neon, magazine, brush, emboss)
- **Caption Style**: A category of caption tone/personality (creative, funny, poetic, minimal, dramatic, quirky)

## Requirements

### Requirement 1

**User Story:** As a user, I want a visually appealing and modern interface, so that I have an engaging experience while creating caption art.

#### Acceptance Criteria

1. WHEN the application loads THEN the system SHALL display a neo-brutalism design with bold 3-5px borders on interactive elements
2. WHEN the application renders components THEN the system SHALL apply vibrant color palette including coral (#FF6B6B), turquoise (#4ECDC4), and yellow (#FFE66D) accent colors
3. WHEN the application displays cards and buttons THEN the system SHALL render offset shadows (4px-12px) for depth
4. WHEN the application loads fonts THEN the system SHALL use Space Grotesk for headings and JetBrains Mono for monospace text
5. WHEN the user interacts with elements THEN the system SHALL provide smooth transitions using cubic-bezier easing

### Requirement 2

**User Story:** As a user, I want smooth animations and micro-interactions, so that the interface feels responsive and delightful to use.

#### Acceptance Criteria

1. WHEN a user hovers over buttons THEN the system SHALL apply a lift effect with increased shadow and slight upward translation
2. WHEN a user clicks a button THEN the system SHALL trigger a bounce animation
3. WHEN the application displays loading states THEN the system SHALL show a rainbow gradient progress bar
4. WHEN caption text is revealed THEN the system SHALL animate it with a typewriter effect
5. WHEN cards enter the viewport THEN the system SHALL apply staggered entry animations

### Requirement 3

**User Story:** As a user, I want to toggle between light and dark themes, so that I can use the application comfortably in different lighting conditions.

#### Acceptance Criteria

1. WHEN a user clicks the theme toggle button THEN the system SHALL switch between light and dark color schemes
2. WHEN the theme changes THEN the system SHALL persist the preference to localStorage
3. WHEN the application loads THEN the system SHALL detect and apply the user's previously saved theme preference
4. WHEN the theme transitions THEN the system SHALL animate color changes smoothly over 0.3 seconds
5. WHEN in dark mode THEN the system SHALL use deep black (#0F0F0F) background while maintaining vibrant accent colors

### Requirement 4

**User Story:** As a user, I want an improved image upload experience, so that I can easily add images to caption.

#### Acceptance Criteria

1. WHEN a user drags an image over the upload zone THEN the system SHALL highlight the zone with a color change
2. WHEN a user drops an image THEN the system SHALL display a preview with a zoom-in animation
3. WHEN an image is uploaded THEN the system SHALL show a loading indicator during processing
4. WHEN the upload completes THEN the system SHALL display the image with smooth fade-in animation
5. WHEN a user clicks the remove button THEN the system SHALL clear the image with a fade-out animation

### Requirement 5

**User Story:** As a user, I want to see caption suggestions in an organized manner, so that I can easily choose the best caption for my image.

#### Acceptance Criteria

1. WHEN caption suggestions are generated THEN the system SHALL display them in a grid layout with neo-brutalism card styling
2. WHEN a user hovers over a caption card THEN the system SHALL apply a lift effect
3. WHEN a user clicks a caption THEN the system SHALL apply it to the text input with a bounce animation
4. WHEN captions are loading THEN the system SHALL display skeleton loaders with shimmer effects
5. WHEN captions appear THEN the system SHALL use staggered entry animations for each card

### Requirement 6

**User Story:** As a user, I want visual feedback for my actions, so that I know the system is responding to my inputs.

#### Acceptance Criteria

1. WHEN a user completes an action THEN the system SHALL display a toast notification sliding in from the right
2. WHEN a user copies text THEN the system SHALL show a success toast with a checkmark icon
3. WHEN an error occurs THEN the system SHALL display an error toast with appropriate messaging
4. WHEN a toast appears THEN the system SHALL auto-dismiss it after 3 seconds
5. WHEN multiple toasts are triggered THEN the system SHALL stack them vertically with proper spacing

### Requirement 7

**User Story:** As a user, I want the existing functionality to remain intact, so that I can continue using all features while enjoying the improved design.

#### Acceptance Criteria

1. WHEN a user uploads an image THEN the system SHALL call the AWS Lambda presign endpoint and upload to S3
2. WHEN an image is uploaded THEN the system SHALL call the caption Lambda to generate AI-powered suggestions
3. WHEN an image is uploaded THEN the system SHALL call the mask Lambda to generate the subject mask
4. WHEN a user enters a license key THEN the system SHALL call the verify Lambda to validate the Gumroad license
5. WHEN a user exports an image THEN the system SHALL generate a canvas composite with text behind the subject effect

### Requirement 8

**User Story:** As a user, I want responsive design, so that I can use the application on different devices.

#### Acceptance Criteria

1. WHEN the viewport width is below 768px THEN the system SHALL apply mobile-optimized layouts
2. WHEN on mobile THEN the system SHALL ensure touch targets are at least 44px for accessibility
3. WHEN the layout changes THEN the system SHALL use flexbox and grid for fluid responsive behavior
4. WHEN on mobile THEN the system SHALL stack cards vertically instead of horizontally
5. WHEN on desktop THEN the system SHALL display multi-column layouts where appropriate
