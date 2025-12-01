/**
 * Progressive Disclosure Logic
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 * 
 * Determines which sidebar sections should be visible based on application state
 */

export interface ApplicationState {
  hasImage: boolean
  hasText: boolean
  hasStyledResult: boolean
}

export interface SectionVisibility {
  upload: boolean
  captions: boolean
  text: boolean
  style: boolean
  transform: boolean
  beforeAfter: boolean
}

/**
 * Determines section visibility based on application state
 * 
 * Progressive disclosure rules:
 * - Upload: Always visible
 * - Captions: Visible when image is uploaded
 * - Text: Visible when image is uploaded
 * - Style: Visible when image is uploaded AND text is entered
 * - Transform: Visible when image is uploaded AND text is entered
 * - Before/After: Visible when image is uploaded AND text is entered AND styled result exists
 * 
 * @param state - Current application state
 * @returns Object indicating which sections should be visible
 */
export function getSectionVisibility(state: ApplicationState): SectionVisibility {
  return {
    upload: true, // Always visible
    captions: state.hasImage,
    text: state.hasImage,
    style: state.hasImage && state.hasText,
    transform: state.hasImage && state.hasText,
    beforeAfter: state.hasImage && state.hasText && state.hasStyledResult,
  }
}
