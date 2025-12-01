# Requirements Document

## Introduction

This document outlines the requirements for the Image Segmentation and Masking System, which generates subject masks to enable the "text behind subject" effect by identifying and isolating foreground subjects from background elements.

## Glossary

- **Image Segmentation System**: The service that separates foreground subjects from background in uploaded images
- **Subject Mask**: An alpha channel image where white pixels represent the foreground subject and black pixels represent the background
- **Rembg Model**: A background removal model that generates subject masks using deep learning
- **Replicate API**: The cloud service providing access to the rembg model
- **Alpha Channel**: The transparency layer in an image that defines opacity for each pixel
- **Foreground Subject**: The main subject or object of interest in an image
- **Mask URL**: The network location of the generated alpha mask image
- **Mask Processing**: Operations performed on the mask to improve quality or compatibility

## Requirements

### Requirement 1

**User Story:** As a user, I want automatic subject detection, so that text can be positioned behind the main subject of my image.

#### Acceptance Criteria

1. WHEN a user uploads an image THEN the Image Segmentation System SHALL call the Replicate API with the image data
2. WHEN the Replicate API processes the image THEN the Image Segmentation System SHALL receive a subject mask URL
3. WHEN the mask URL is received THEN the Image Segmentation System SHALL download the mask image
4. WHEN the mask is downloaded THEN the Image Segmentation System SHALL validate that it is a valid PNG with alpha channel
5. WHEN validation succeeds THEN the Image Segmentation System SHALL make the mask available to the Canvas Compositing Engine

### Requirement 2

**User Story:** As a user, I want accurate subject detection, so that the text-behind effect looks natural and professional.

#### Acceptance Criteria

1. WHEN the rembg model processes an image THEN the Image Segmentation System SHALL receive a mask with clean subject edges
2. WHEN the subject has complex boundaries THEN the Image Segmentation System SHALL preserve fine details like hair and fur
3. WHEN multiple subjects exist THEN the Image Segmentation System SHALL include all foreground subjects in the mask
4. WHEN the background is complex THEN the Image Segmentation System SHALL accurately separate subject from background
5. WHEN the subject has transparent or semi-transparent elements THEN the Image Segmentation System SHALL preserve partial opacity

### Requirement 3

**User Story:** As a user, I want fast mask generation, so that I can quickly see the text-behind effect after uploading an image.

#### Acceptance Criteria

1. WHEN calling the Replicate API THEN the Image Segmentation System SHALL set a timeout of 45 seconds
2. WHEN the API responds THEN the Image Segmentation System SHALL download the mask within 10 seconds
3. WHEN mask generation completes THEN the Image Segmentation System SHALL return results within 60 seconds total
4. WHEN processing is in progress THEN the Image Segmentation System SHALL display a loading indicator
5. WHEN the mask is ready THEN the Image Segmentation System SHALL notify the Canvas Compositing Engine to re-render

### Requirement 4

**User Story:** As a user, I want to see a preview of the mask, so that I can verify the subject detection is accurate.

#### Acceptance Criteria

1. WHEN a mask is generated THEN the Image Segmentation System SHALL provide a preview visualization option
2. WHEN preview mode is enabled THEN the Image Segmentation System SHALL display the mask as a black and white overlay
3. WHEN viewing the preview THEN the Image Segmentation System SHALL show white areas as detected subject and black as background
4. WHEN the user toggles preview THEN the Image Segmentation System SHALL switch between normal and mask preview modes
5. WHEN exporting THEN the Image Segmentation System SHALL use the full mask regardless of preview state

### Requirement 5

**User Story:** As a user, I want meaningful error messages, so that I understand what went wrong if mask generation fails.

#### Acceptance Criteria

1. WHEN the Replicate API returns an error THEN the Image Segmentation System SHALL display a user-friendly error message
2. WHEN the mask download fails THEN the Image Segmentation System SHALL inform the user and offer to retry
3. WHEN API rate limits are exceeded THEN the Image Segmentation System SHALL inform the user to try again later
4. WHEN the image has no detectable subject THEN the Image Segmentation System SHALL inform the user and disable the text-behind effect
5. WHEN network connectivity fails THEN the Image Segmentation System SHALL display a connection error message

### Requirement 6

**User Story:** As a user, I want to regenerate the mask, so that I can try again if the initial detection is inaccurate.

#### Acceptance Criteria

1. WHEN a user clicks the regenerate mask button THEN the Image Segmentation System SHALL call the Replicate API again
2. WHEN regenerating THEN the Image Segmentation System SHALL use the same image data as the original request
3. WHEN regeneration is in progress THEN the Image Segmentation System SHALL display a loading indicator
4. WHEN regeneration completes THEN the Image Segmentation System SHALL replace the previous mask with the new one
5. WHEN regeneration fails THEN the Image Segmentation System SHALL retain the previous mask if available

### Requirement 7

**User Story:** As a user, I want the mask to work with different image formats, so that I can use any supported image type.

#### Acceptance Criteria

1. WHEN a JPG image is uploaded THEN the Image Segmentation System SHALL process it and generate a valid mask
2. WHEN a PNG image is uploaded THEN the Image Segmentation System SHALL process it and generate a valid mask
3. WHEN an image with transparency is uploaded THEN the Image Segmentation System SHALL handle the alpha channel correctly
4. WHEN the mask is generated THEN the Image Segmentation System SHALL output a PNG format with alpha channel
5. WHEN the mask is applied THEN the Image Segmentation System SHALL ensure compatibility with the Canvas Compositing Engine

### Requirement 8

**User Story:** As a user, I want to disable the text-behind effect, so that I can place text normally on top of the image if desired.

#### Acceptance Criteria

1. WHEN a user toggles the text-behind effect off THEN the Image Segmentation System SHALL inform the Canvas Compositing Engine to skip mask compositing
2. WHEN the effect is disabled THEN the Image Segmentation System SHALL retain the mask data for potential re-enabling
3. WHEN the effect is re-enabled THEN the Image Segmentation System SHALL apply the existing mask without regenerating
4. WHEN no mask exists and effect is enabled THEN the Image Segmentation System SHALL trigger mask generation
5. WHEN exporting with effect disabled THEN the Image Segmentation System SHALL render text on top of the image without masking
