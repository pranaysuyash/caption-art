# Manual Testing Guide - AI Caption Generation System

This guide provides instructions for manually testing the AI Caption Generation System to verify all requirements are met.

## Prerequisites

1. Set up environment variables:
   ```bash
   # In frontend/.env.local
   VITE_REPLICATE_API_TOKEN=your_replicate_api_token
   VITE_OPENAI_API_KEY=your_openai_api_key
   ```

2. Start the development server:
   ```bash
   cd frontend
   npm run dev
   ```

3. Prepare test images:
   - Photos (landscapes, portraits, objects)
   - Illustrations and digital art
   - Screenshots and UI mockups
   - Various file formats (JPG, PNG, WebP)
   - Various file sizes (small, medium, large)

## Test 19.1: Test with Real Images

### Objective
Verify that the system generates relevant captions for various image types.

### Test Cases

#### TC 19.1.1: Photo - Landscape
- **Steps:**
  1. Upload a landscape photo (e.g., mountains, beach, forest)
  2. Wait for caption generation to complete
  3. Review the generated captions
- **Expected Results:**
  - Base caption describes the scene accurately
  - Variants maintain the core subject matter
  - All captions are contextually relevant
  - Generation completes within 45 seconds

#### TC 19.1.2: Photo - Portrait
- **Steps:**
  1. Upload a portrait photo
  2. Wait for caption generation to complete
  3. Review the generated captions
- **Expected Results:**
  - Base caption describes the person/people without identifying them
  - Variants describe actions and settings
  - No personal identification information in captions

#### TC 19.1.3: Photo - Objects
- **Steps:**
  1. Upload a photo of objects (e.g., food, products, items)
  2. Wait for caption generation to complete
  3. Review the generated captions
- **Expected Results:**
  - Base caption identifies the objects
  - Variants maintain object references
  - Captions are descriptive and relevant

#### TC 19.1.4: Illustration/Digital Art
- **Steps:**
  1. Upload an illustration or digital artwork
  2. Wait for caption generation to complete
  3. Review the generated captions
- **Expected Results:**
  - Base caption describes the artistic content
  - Variants capture the artistic style
  - Captions are appropriate for creative content

#### TC 19.1.5: Screenshot/UI Mockup
- **Steps:**
  1. Upload a screenshot or UI mockup
  2. Wait for caption generation to complete
  3. Review the generated captions
- **Expected Results:**
  - Base caption describes visual elements
  - Captions focus on visual design, not embedded text
  - Variants are contextually appropriate

### Verification Checklist
- [ ] All image types generate captions successfully
- [ ] Captions are contextually relevant to image content
- [ ] Variants have different styles
- [ ] No errors or crashes occur
- [ ] Generation time is reasonable (< 45 seconds)

---

## Test 19.2: Test Caption Quality

### Objective
Verify that captions match their assigned style characteristics.

### Test Cases

#### TC 19.2.1: Creative Style
- **Steps:**
  1. Upload any image
  2. Locate the "Creative" caption variant
  3. Analyze the caption text
- **Expected Results:**
  - Caption uses imaginative language
  - Contains artistic or metaphorical expressions
  - Feels creative and expressive
  - **Requirements: 2.1**

#### TC 19.2.2: Funny Style
- **Steps:**
  1. Upload any image
  2. Locate the "Funny" caption variant
  3. Analyze the caption text
- **Expected Results:**
  - Caption has humorous tone
  - Uses playful language
  - Feels entertaining or witty
  - **Requirements: 2.2**

#### TC 19.2.3: Poetic Style
- **Steps:**
  1. Upload any image
  2. Locate the "Poetic" caption variant
  3. Analyze the caption text
- **Expected Results:**
  - Caption uses lyrical language
  - Contains metaphors or imagery
  - Has rhythmic or flowing quality
  - **Requirements: 2.3**

#### TC 19.2.4: Minimal Style
- **Steps:**
  1. Upload any image
  2. Locate the "Minimal" caption variant
  3. Analyze the caption text
- **Expected Results:**
  - Caption is concise
  - Uses fewest words possible
  - Still maintains impact and meaning
  - **Requirements: 2.4**

#### TC 19.2.5: Dramatic Style
- **Steps:**
  1. Upload any image
  2. Locate the "Dramatic" caption variant
  3. Analyze the caption text
- **Expected Results:**
  - Caption uses intense language
  - Evokes strong emotions
  - Feels powerful or impactful
  - **Requirements: 2.5**

### Verification Checklist
- [ ] Creative captions are imaginative
- [ ] Funny captions are humorous
- [ ] Poetic captions are lyrical
- [ ] Minimal captions are concise
- [ ] Dramatic captions are intense
- [ ] All variants are different from each other
- [ ] Style labels match caption characteristics

---

## Test 19.3: Test Caption Length

### Objective
Verify that all captions meet length requirements and display accurate character counts.

### Test Cases

#### TC 19.3.1: Caption Length Bounds
- **Steps:**
  1. Upload multiple different images
  2. For each generated caption (base + variants):
     - Count the characters
     - Verify length is within bounds
- **Expected Results:**
  - All captions are 10-100 characters
  - No caption is shorter than 10 characters
  - No caption is longer than 100 characters
  - **Requirements: 8.1, 8.2, 8.3**

#### TC 19.3.2: Character Count Display
- **Steps:**
  1. Upload an image
  2. For each caption card, check the character count display
  3. Manually count characters and compare
- **Expected Results:**
  - Character count is displayed on each caption card
  - Displayed count matches actual character count
  - Count updates if caption is edited
  - **Requirements: 8.4**

#### TC 19.3.3: Manual Editing
- **Steps:**
  1. Upload an image and generate captions
  2. Select a caption
  3. Edit the caption text in the application
  4. Verify character count updates
- **Expected Results:**
  - Caption can be edited after selection
  - Character count updates in real-time
  - Edited caption can be used in the application
  - **Requirements: 8.5**

### Verification Checklist
- [ ] All captions are 10-100 characters
- [ ] Character count display is accurate
- [ ] Character count updates when editing
- [ ] Manual editing works correctly
- [ ] No captions are truncated unexpectedly

---

## Test 19.4: Test Error Scenarios

### Objective
Verify that the system handles errors gracefully with clear, user-friendly messages.

### Test Cases

#### TC 19.4.1: Invalid Image Format
- **Steps:**
  1. Attempt to upload a non-image file (e.g., .txt, .pdf, .doc)
  2. Observe the error message
- **Expected Results:**
  - Upload is rejected
  - Error message: "Unsupported file type. Please use JPG, PNG, or WebP."
  - Message is clear and actionable
  - **Requirements: 4.4**

#### TC 19.4.2: Oversized Image
- **Steps:**
  1. Attempt to upload an image larger than 10MB
  2. Observe the error message
- **Expected Results:**
  - Upload is rejected
  - Error message: "File too large. Maximum size is 10MB."
  - Message specifies the size limit
  - **Requirements: 4.4**

#### TC 19.4.3: Empty/Corrupted Image
- **Steps:**
  1. Attempt to upload an empty or corrupted image file
  2. Observe the error message
- **Expected Results:**
  - Upload is rejected
  - Error message: "Invalid image file. Please try another."
  - Message is user-friendly
  - **Requirements: 4.4**

#### TC 19.4.4: Network Disconnected
- **Steps:**
  1. Disconnect from the internet
  2. Attempt to upload an image and generate captions
  3. Observe the error message
- **Expected Results:**
  - Error message: "No internet connection. Please check your network."
  - Generation button is disabled
  - Message is clear about the issue
  - **Requirements: 4.5**

#### TC 19.4.5: API Rate Limit
- **Steps:**
  1. Upload multiple images rapidly (10+ in quick succession)
  2. Observe the behavior when rate limit is hit
- **Expected Results:**
  - Error message: "Too many requests. Please wait [X] seconds."
  - Wait time is displayed
  - Regenerate button is disabled during wait
  - **Requirements: 4.3**

#### TC 19.4.6: API Timeout
- **Steps:**
  1. Upload an image
  2. If generation takes longer than expected, observe timeout behavior
- **Expected Results:**
  - Timeout occurs after 45 seconds total (30s Replicate + 15s OpenAI)
  - Error message: "Caption generation timed out. Please try again."
  - User can retry the operation
  - **Requirements: 3.1, 3.2, 3.3, 3.4**

#### TC 19.4.7: Replicate API Error
- **Steps:**
  1. (Simulate by using invalid API key or during service outage)
  2. Attempt to generate captions
  3. Observe the error message
- **Expected Results:**
  - Error message is user-friendly (no raw API errors)
  - Message suggests trying again later
  - No stack traces or technical details shown
  - **Requirements: 4.1**

#### TC 19.4.8: OpenAI API Error
- **Steps:**
  1. (Simulate by using invalid API key or during service outage)
  2. Attempt to generate captions
  3. Observe the error message
- **Expected Results:**
  - Error message is user-friendly
  - Message suggests trying again later
  - No raw API errors or stack traces
  - **Requirements: 4.2**

### Verification Checklist
- [ ] Invalid formats are rejected with clear messages
- [ ] Oversized images are rejected with size limit info
- [ ] Empty/corrupted images are rejected gracefully
- [ ] Network errors show appropriate messages
- [ ] Rate limiting is handled with wait time display
- [ ] Timeouts show clear error messages
- [ ] All error messages are user-friendly
- [ ] No technical details or stack traces in error messages
- [ ] Error messages start with capital letter and end with punctuation
- [ ] Error messages are actionable (tell user what to do)

---

## Additional Verification

### Cache Behavior
- **Steps:**
  1. Upload an image and generate captions
  2. Upload the same image again
  3. Observe the generation time
- **Expected Results:**
  - Second generation is instant (cached)
  - Results are identical to first generation
  - **Requirements: 6.1, 6.2**

### Regenerate Functionality
- **Steps:**
  1. Upload an image and generate captions
  2. Click the "Regenerate" button
  3. Compare new captions to original
- **Expected Results:**
  - New captions are generated (not cached)
  - Variants are different from original
  - Base caption may be the same (same image)
  - **Requirements: 6.1, 6.3, 6.4**

### Loading States
- **Steps:**
  1. Upload an image
  2. Observe the UI during generation
- **Expected Results:**
  - Loading indicator is shown
  - Progress message updates ("Analyzing image..." → "Generating variations...")
  - Progress bar shows progress
  - Regenerate button is disabled during generation
  - **Requirements: 3.4, 3.5**

### UI/UX
- **Steps:**
  1. Upload an image and generate captions
  2. Interact with caption cards
  3. Test hover states and selection
- **Expected Results:**
  - Caption cards have hover effects
  - Base caption is labeled "Original Description"
  - Variants are labeled with style names
  - Base caption appears first in the list
  - Character count is visible on each card
  - **Requirements: 5.1, 5.2, 5.3, 5.4**

---

## Test Results Template

Use this template to record your test results:

```
Test Date: _______________
Tester: _______________
Environment: _______________

Test 19.1: Test with Real Images
- TC 19.1.1: [ ] Pass [ ] Fail - Notes: _______________
- TC 19.1.2: [ ] Pass [ ] Fail - Notes: _______________
- TC 19.1.3: [ ] Pass [ ] Fail - Notes: _______________
- TC 19.1.4: [ ] Pass [ ] Fail - Notes: _______________
- TC 19.1.5: [ ] Pass [ ] Fail - Notes: _______________

Test 19.2: Test Caption Quality
- TC 19.2.1: [ ] Pass [ ] Fail - Notes: _______________
- TC 19.2.2: [ ] Pass [ ] Fail - Notes: _______________
- TC 19.2.3: [ ] Pass [ ] Fail - Notes: _______________
- TC 19.2.4: [ ] Pass [ ] Fail - Notes: _______________
- TC 19.2.5: [ ] Pass [ ] Fail - Notes: _______________

Test 19.3: Test Caption Length
- TC 19.3.1: [ ] Pass [ ] Fail - Notes: _______________
- TC 19.3.2: [ ] Pass [ ] Fail - Notes: _______________
- TC 19.3.3: [ ] Pass [ ] Fail - Notes: _______________

Test 19.4: Test Error Scenarios
- TC 19.4.1: [ ] Pass [ ] Fail - Notes: _______________
- TC 19.4.2: [ ] Pass [ ] Fail - Notes: _______________
- TC 19.4.3: [ ] Pass [ ] Fail - Notes: _______________
- TC 19.4.4: [ ] Pass [ ] Fail - Notes: _______________
- TC 19.4.5: [ ] Pass [ ] Fail - Notes: _______________
- TC 19.4.6: [ ] Pass [ ] Fail - Notes: _______________
- TC 19.4.7: [ ] Pass [ ] Fail - Notes: _______________
- TC 19.4.8: [ ] Pass [ ] Fail - Notes: _______________

Additional Verification
- Cache Behavior: [ ] Pass [ ] Fail - Notes: _______________
- Regenerate Functionality: [ ] Pass [ ] Fail - Notes: _______________
- Loading States: [ ] Pass [ ] Fail - Notes: _______________
- UI/UX: [ ] Pass [ ] Fail - Notes: _______________

Overall Result: [ ] Pass [ ] Fail
Issues Found: _______________
```

---

## Running Automated Tests

Before manual testing, run the automated test suite:

```bash
cd frontend

# Run all tests
npm test

# Run only integration tests
npm test finalTesting.integration.test.ts

# Run with API keys (for real API tests)
VITE_REPLICATE_API_TOKEN=your_key VITE_OPENAI_API_KEY=your_key npm test finalTesting.integration.test.ts
```

---

## Notes

- Some tests require real API keys and will make actual API calls
- API calls may incur costs - use test images sparingly
- Rate limiting may affect rapid testing - wait between tests if needed
- Network conditions may affect generation times
- Manual testing is essential for verifying caption quality and style appropriateness
