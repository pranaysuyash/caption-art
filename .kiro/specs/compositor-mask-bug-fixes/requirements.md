# Requirements Document - Compositor Mask Bug Fixes

## Introduction

This feature addresses critical bugs in the canvas compositor that are blocking users from properly using the text-behind-subject effect. Users are experiencing white mask silhouettes instead of proper image-text composites, masks applying even when no text is entered, and CSS clipping/aspect ratio problems that distort the final output.

## Glossary

- **Compositor**: The canvas rendering engine that combines background images, text layers, and mask layers
- **Mask Layer**: An alpha channel layer that defines which parts of the text should appear behind the subject
- **Text-Behind Effect**: The visual effect where text appears to be positioned behind the subject in an image
- **Blend Mode**: The compositing operation used to combine layers (e.g., destination-out, source-over)
- **Canvas Context**: The 2D rendering context used for drawing operations
- **Alpha Channel**: The transparency information in an image
- **Aspect Ratio**: The proportional relationship between width and height

## Requirements

### Requirement 1

**User Story:** As a user, I want the text-behind effect to show the actual image with text behind the subject, so that I can create professional-looking composites without white silhouettes.

#### Acceptance Criteria

1. WHEN the compositor renders a masked composite THEN the system SHALL display the original background image with text appearing behind the subject
2. WHEN the mask layer is applied THEN the system SHALL use the mask's alpha channel to cut out text rather than replacing the background with white
3. WHEN the final composite is rendered THEN the system SHALL preserve the original image colors and details in all visible areas
4. WHEN multiple layers are composited THEN the system SHALL apply blend modes in the correct order to achieve the text-behind effect
5. WHEN the canvas is cleared and re-rendered THEN the system SHALL not leave residual white artifacts from previous renders

### Requirement 2

**User Story:** As a user, I want masks to only apply when I have entered text, so that I don't see unexpected masking effects on my images when the text field is empty.

#### Acceptance Criteria

1. WHEN the text input is empty THEN the system SHALL render only the background image without applying any mask
2. WHEN the text input is empty THEN the system SHALL skip mask layer creation and compositing operations
3. WHEN text is added after being empty THEN the system SHALL apply the mask layer and render the text-behind effect
4. WHEN text is removed after being present THEN the system SHALL remove the mask layer and return to showing only the background
5. WHEN the mask generation is in progress but text is empty THEN the system SHALL ignore the mask result

### Requirement 3

**User Story:** As a user, I want my images to maintain their correct aspect ratio and not be clipped, so that my final output looks professional and matches my original image dimensions.

#### Acceptance Criteria

1. WHEN an image is loaded THEN the system SHALL calculate and preserve the original aspect ratio throughout all rendering operations
2. WHEN the canvas is scaled to fit the viewport THEN the system SHALL apply uniform scaling to both width and height
3. WHEN the canvas dimensions are set THEN the system SHALL ensure no content is clipped outside the visible area
4. WHEN CSS styles are applied to the canvas THEN the system SHALL not override the calculated dimensions with fixed values
5. WHEN the viewport is resized THEN the system SHALL recalculate scaling while maintaining aspect ratio

### Requirement 4

**User Story:** As a user, I want the compositor to handle edge cases gracefully, so that I can work with various image sizes, mask qualities, and text configurations without errors.

#### Acceptance Criteria

1. WHEN the mask has partial transparency THEN the system SHALL correctly interpolate alpha values for smooth edges
2. WHEN the image dimensions differ from the mask dimensions THEN the system SHALL scale the mask to match the image
3. WHEN the canvas context is lost THEN the system SHALL detect the error and attempt to restore the context
4. WHEN rendering operations fail THEN the system SHALL log the error and maintain the previous valid state
5. WHEN memory limits are approached THEN the system SHALL clean up unused canvas references and cached layers

### Requirement 5

**User Story:** As a developer, I want clear separation between rendering logic and state management, so that bugs can be isolated and fixed without affecting other parts of the system.

#### Acceptance Criteria

1. WHEN the compositor renders THEN the system SHALL not modify application state directly
2. WHEN layer operations are performed THEN the system SHALL operate only on canvas contexts and image data
3. WHEN errors occur in rendering THEN the system SHALL propagate errors to the caller without side effects
4. WHEN the compositor is initialized THEN the system SHALL validate all required parameters before proceeding
5. WHEN blend modes are applied THEN the system SHALL restore the previous globalCompositeOperation after each operation
