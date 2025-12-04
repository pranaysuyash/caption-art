# Complete Testing Guide - Part 3: Use Cases & Testing Scenarios

**Document Version:** 1.0  
**Created:** December 4, 2025  
**Status:** Active Testing Guide  
**Audience:** QA Engineers, Test Automation, Developers

---

## 📑 TABLE OF CONTENTS

1. [User Personas & Use Cases](#user-personas--use-cases)
2. [End-to-End Testing Scenarios](#end-to-end-testing-scenarios)
3. [Edge Cases & Error Scenarios](#edge-cases--error-scenarios)
4. [Performance & Load Testing](#performance--load-testing)
5. [Security Testing](#security-testing)
6. [Mobile & Responsive Testing](#mobile--responsive-testing)

---

## 👥 USER PERSONAS & USE CASES

### Persona 1: Social Media Manager

**Background:** Manages social media for 5-10 client brands, posts 5-10 times per week

**Goals:**

- Generate captions quickly for multiple assets
- Maintain consistent brand voice across platforms
- Approve best variations efficiently
- Export ready-to-post content

**Use Case: "Generate Captions for Weekly Posts"**

```
TIMELINE: Monday morning, 30 minutes total

Step 1: Login (1 min)
├─ Open platform
├─ Enter credentials
└─ Navigate to workspace

Step 2: Select Client Workspace (2 min)
├─ Choose from 5 workspaces
├─ View campaigns list
└─ Click "Weekly Posts" campaign

Step 3: Upload 8 Weekly Images (5 min)
├─ Drag-drop 8 social images
├─ Verify all uploaded
├─ Check file sizes (all <5MB)
└─ 7 portraits + 1 landscape

Step 4: Generate Captions (10 min)
├─ Select "Instagram" platform
├─ Keep brand kit (client's style)
├─ Click Generate
├─ Monitor progress (usually 2-3 min)
├─ Review results
└─ All captions ready

Step 5: Quick Review & Export (12 min)
├─ Go to Review Grid
├─ Most captions auto-selected (good scores)
├─ Edit 2-3 captions manually
├─ Batch approve all
├─ Click Export
├─ Download ZIP
└─ Check contents quickly

SUCCESS METRICS:
✅ 8 posts generated in 30 min
✅ Ready to schedule on Later/Buffer
✅ Consistent brand voice
✅ Minimal manual edits needed
```

### Persona 2: Creative Designer

**Background:** Freelance designer working with 3-5 agency clients, needs visual content

**Goals:**

- Generate mask overlays for text placement
- Create visually distinctive content
- Export high-quality assets
- Maintain design consistency

**Use Case: "Generate Masked Assets for Design Compositing"**

```
TIMELINE: Project work, 45 minutes total

Step 1: Setup Campaign (5 min)
├─ Create new campaign for project
├─ Set campaign brief
├─ Add reference creative
│  └─ Upload 3 design examples
└─ Select brand kit (client provided)

Step 2: Upload Reference Images (8 min)
├─ Upload 15 product images
├─ All high-res (3000x3000px)
├─ Various backgrounds
└─ Verify all processed

Step 3: Generate Masks (15 min)
├─ Request mask generation for all
├─ Check for accurate subject isolation
├─ Flag 2 images with complex backgrounds
├─ Request re-generation with adjustments
└─ All 15 masks ready

Step 4: Generate Captions & Ad Copy (12 min)
├─ Select "Creative" tone
├─ Include target platforms
├─ Generate captions + ad copy
├─ Review results
└─ Approve all high-scoring variants

Step 5: Export for Design (5 min)
├─ Export with masks included
├─ Export ad copy as JSON
├─ Include scoring data
├─ Download ZIP
└─ Ready for Adobe integration

SUCCESS METRICS:
✅ 15 masked assets generated
✅ 45 caption variations available
✅ Ad copy ready for layouts
✅ ZIP structured for easy import
```

### Persona 3: Agency Owner

**Background:** Runs agency with team of 5-10 people, manages 20-50 clients

**Goals:**

- Oversee team's work
- Ensure quality standards
- Generate revenue through client work
- Scale operations efficiently

**Use Case: "Review Team's Generated Content & Approve for Client"**

```
TIMELINE: Management review, 1 hour total

Step 1: Dashboard Overview (5 min)
├─ Check team status
├─ See active campaigns
├─ Review pending approvals
└─ Identify bottlenecks

Step 2: Review Client Campaign (30 min)
├─ Open client "Q1 Marketing" campaign
├─ Check team's generated captions
├─ Verify brand voice compliance
├─ Check scoring (ensure high-quality)
├─ Make editorial adjustments (2-3 edits)
└─ Approve final set

Step 3: Quality Assurance (15 min)
├─ Review ad copy quality
├─ Check export structure
├─ Verify all assets included
├─ Sample checking (spot 5-6 items)
└─ Quality passes

Step 4: Export & Delivery (10 min)
├─ Generate final ZIP
├─ Add client branding/invoice
├─ Download for delivery
├─ Share with client
└─ Mark campaign complete

SUCCESS METRICS:
✅ Team work validated
✅ Quality standards met
✅ Client deliverable ready
✅ Team gets feedback for improvement
```

---

## 🎯 END-TO-END TESTING SCENARIOS

### Scenario 1: Complete Happy Path (Full Workflow)

**Objective:** Verify entire system works from login to export

**Preconditions:**

- User account exists
- No prior campaigns
- No uploaded assets

**Steps:**

```
1. AUTHENTICATION
   ├─ Navigate to /login
   ├─ Enter test@example.com
   ├─ Enter password
   ├─ Click Login
   └─ VERIFY: Redirect to /agency/workspaces

2. WORKSPACE SETUP
   ├─ Click "Create Workspace"
   ├─ Enter name: "Test Campaign Q1"
   ├─ Click Create
   └─ VERIFY: Workspace appears in list

3. BRAND KIT CREATION
   ├─ Click workspace
   ├─ Go to Brand Kit section
   ├─ Click "New Brand Kit"
   ├─ Fill form:
   │  ├─ Name: "Tech Brand"
   │  ├─ Colors: Blue (#0066FF), Green (#00CC66), Gray (#333333)
   │  ├─ Fonts: Open Sans (body), Montserrat (heading)
   │  ├─ Personality: Professional, Modern, Innovative
   │  ├─ Tone: Formal, Tech-focused
   │  └─ Preferred phrases: "Cutting-edge", "Innovation"
   ├─ Click Save
   └─ VERIFY: Brand kit appears in list

4. CAMPAIGN CREATION
   ├─ Go to Campaigns tab
   ├─ Click "New Campaign"
   ├─ Fill form:
   │  ├─ Name: "Product Launch Campaign"
   │  ├─ Objective: "Increase brand awareness"
   │  ├─ Target Audience: "Tech-savvy professionals 25-40"
   │  ├─ Brand Kit: Select "Tech Brand"
   │  ├─ Brief: "New SaaS product launch for enterprise market"
   │  └─ Reference creatives: Upload 2 competitor examples
   ├─ Click Create
   └─ VERIFY: Campaign shows in list, detail page opens

5. ASSET UPLOAD
   ├─ Go to Assets section
   ├─ Drag-drop 5 product images
   ├─ Monitor upload progress
   ├─ VERIFY each uploads to 100%
   ├─ Verify thumbnails show
   └─ VERIFY: All 5 assets visible with metadata

6. CAPTION GENERATION
   ├─ Go to Generate section
   ├─ Select tone: "Professional"
   ├─ Variations: 3 (default)
   ├─ Platforms: Instagram, LinkedIn
   ├─ Click "Generate Captions"
   ├─ Monitor job progress
   │  └─ Should show: 0/5 → 5/5 assets
   ├─ Wait for completion (~2-3 min)
   ├─ View results with scores
   │  └─ Clarity, Originality, Brand Consistency, Platform Relevance
   └─ VERIFY: 15 captions generated (3×5) with scores

7. MASK GENERATION (Optional)
   ├─ For 2-3 assets, request mask
   ├─ Monitor mask job
   ├─ Preview mask results
   └─ VERIFY: Mask shows white subject on black background

8. AD COPY GENERATION
   ├─ Trigger ad copy generation
   ├─ For each asset: Headline + Body + CTA
   ├─ Monitor job completion
   └─ VERIFY: 5 ad copy sets generated

9. REVIEW & APPROVAL
   ├─ Navigate to Review Grid
   ├─ View all 5 assets in grid
   ├─ For each asset:
   │  ├─ Review 3 caption options
   │  ├─ Check scoring
   │  ├─ Select best option OR edit
   │  ├─ Click approve
   │  └─ VERIFY: Checkmark appears
   ├─ Batch select all 5 remaining
   ├─ Bulk approve
   └─ VERIFY: All marked approved

10. EXPORT
    ├─ Click "Export" button
    ├─ Choose format: ZIP
    ├─ Select content:
    │  ├─ [x] Images + Captions
    │  ├─ [x] Ad Copy
    │  ├─ [x] Scoring Data
    │  └─ [ ] Raw data
    ├─ Click "Download"
    ├─ Monitor download progress
    └─ VERIFY: ZIP file downloaded

11. POST-DOWNLOAD VERIFICATION
    ├─ Extract ZIP on local machine
    ├─ Verify structure:
    │  ├─ /images/ (5 files)
    │  ├─ /captions/ (5 files, 1 per image)
    │  ├─ /ad-copy/ (5 JSON files)
    │  ├─ manifest.json (metadata)
    │  └─ scoring.json (all scores)
    ├─ Check image files (all <5MB each)
    ├─ Check caption formatting
    ├─ Check ad copy structure
    └─ VERIFY: All expected files present & valid

FINAL RESULT: ✅ PASS - Complete workflow successful
```

---

### Scenario 2: Team Collaboration (Multiple Users)

**Objective:** Verify multi-user access and collaboration workflows

**Preconditions:**

- 2 user accounts exist (Manager + Designer)
- Same workspace created
- Campaign in progress

**Steps:**

```
1. DESIGNER UPLOADS ASSETS (5 min)
   ├─ Designer logs in
   ├─ Opens shared workspace/campaign
   ├─ Uploads 10 product images
   ├─ Shows upload complete
   └─ VERIFY: Manager sees assets immediately on refresh

2. MANAGER REVIEWS UPLOADS (2 min)
   ├─ Manager logs in
   ├─ Refreshes campaign page
   ├─ Sees 10 newly uploaded assets
   ├─ Manager adds campaign brief
   └─ VERIFY: Designer sees changes on refresh

3. BOTH GENERATE CAPTIONS (3 min)
   ├─ Manager clicks Generate
   ├─ Designer also clicks Generate (concurrent)
   ├─ Both monitoring progress
   ├─ Both jobs complete independently
   ├─ Both view their own results
   └─ VERIFY: No conflicts or errors

4. MANAGER REVIEWS & APPROVES (5 min)
   ├─ Manager goes to Review Grid
   ├─ Approves 8/10 captions
   ├─ Edits 1 caption manually
   ├─ Rejects 1 poor caption
   └─ VERIFY: Approval status persists

5. DESIGNER SEES APPROVALS (2 min)
   ├─ Designer refreshes Review Grid
   ├─ Sees manager's approvals
   ├─ Can see edited caption
   └─ VERIFY: Manager's changes visible to designer

6. MANAGER EXPORTS (2 min)
   ├─ Manager exports ZIP
   ├─ Downloads file
   └─ VERIFY: File includes only approved items

COLLABORATION RESULT: ✅ PASS - Multi-user workflow successful
```

---

## ⚠️ EDGE CASES & ERROR SCENARIOS

### Edge Case 1: Large File Upload

**Scenario:** Upload 25MB image to platform with 50MB limit

```
Expected Behavior:
├─ File begins uploading
├─ Progress bar shows realistic estimate
├─ Upload completes in ~30-45 seconds
├─ File appears in asset list
└─ Can be used in generation

Test Verification:
├─ Upload 2-3 large files (20-45MB each)
├─ Verify upload doesn't timeout
├─ Verify file size shown correctly
├─ Verify generation works with large files
└─ Verify export includes all large files
```

### Edge Case 2: Maximum Assets (20)

**Scenario:** Upload exactly 20 assets, then try to upload 21st

```
Expected Behavior:
├─ Upload 20 files successfully
├─ Show count indicator: "20/20"
├─ 21st upload blocked
├─ Error message: "At upload limit for this campaign"
├─ Offer to delete one to upload new one
└─ User can delete one and re-upload

Test Verification:
├─ Upload 19 files
├─ Upload 20th successfully
├─ Attempt 21st upload
├─ VERIFY: Error message shown
├─ Delete one file
├─ Upload new file successfully
└─ VERIFY: File count back at 20
```

### Edge Case 3: Concurrent Generations

**Scenario:** Generate captions while still generating masks

```
Expected Behavior:
├─ Both jobs run concurrently
├─ Each has independent progress tracking
├─ No conflicts or data corruption
├─ Both complete successfully
└─ Results display correctly

Test Verification:
├─ Start mask generation for 3 assets
├─ After 10 seconds, start caption generation
├─ Both show progress independently
├─ Both complete and display results
└─ VERIFY: No interference between jobs
```

### Edge Case 4: No Assets

**Scenario:** User tries to generate captions without uploading assets

```
Expected Behavior:
├─ Generate button is DISABLED
├─ Hover shows tooltip: "Upload assets first"
├─ OR user tries API call directly
├─ API returns 400 error with message
└─ Error message shown in UI

Test Verification:
├─ Campaign with no assets
├─ Generate button disabled
├─ Try POST /caption/batch with empty assetIds
├─ VERIFY: 400 error response
└─ VERIFY: Error displayed to user
```

### Error Scenario 1: API Timeout

**Scenario:** OpenAI API takes too long (>5 minutes)

```
Expected Behavior:
├─ After 5 minutes, show timeout error
├─ Offer retry button
├─ Store partial results if any
├─ Don't lose user's data
└─ Allow restart of generation

Test Verification:
├─ Use network throttling to simulate timeout
├─ Monitor job progress
├─ After timeout, show error state
├─ Click retry → Job restarts
└─ VERIFY: Data not lost
```

### Error Scenario 2: Network Failure During Upload

**Scenario:** User loses internet while uploading files

```
Expected Behavior:
├─ Upload pauses
├─ Show "Upload paused" state
├─ When connection restored:
│  ├─ Resume button appears
│  └─ Resume upload
├─ OR allow cancel and restart
└─ Partial uploads cleaned up

Test Verification:
├─ Disconnect network during upload
├─ Upload pauses
├─ Reconnect network
├─ Upload resumes or can restart
└─ VERIFY: No partial files left
```

### Error Scenario 3: Authentication Expires

**Scenario:** Session expires while user is working

```
Expected Behavior:
├─ User gets 401 Unauthorized
├─ Redirect to login page
├─ Show message: "Session expired, please log in again"
├─ After login, can continue (if data saved)
└─ OR ask to restart

Test Verification:
├─ Set session timeout to 5 minutes
├─ Login and work on campaign
├─ Wait 6 minutes
├─ Try to perform action (save, generate)
├─ VERIFY: Redirected to login
├─ Login again
└─ VERIFY: Can access same campaign
```

---

## 📊 PERFORMANCE & LOAD TESTING

### Performance Test 1: Caption Generation Speed

**Objective:** Verify generation completes within acceptable time

```
Test Setup:
├─ 5 images
├─ Generate 3 variations each
├─ Platform: Single
└─ Brand kit: Applied

Expected Result:
├─ Generation starts immediately
├─ First caption: <30 seconds
├─ All 15 captions: <3 minutes
├─ Progress updates every 10 seconds
└─ User kept informed

Measurements to Track:
├─ Time to first caption
├─ Time to completion
├─ Progress bar accuracy
├─ UI responsiveness during generation
└─ CPU/memory usage
```

### Performance Test 2: Export Speed

**Objective:** Verify ZIP creation and download are fast

```
Test Setup:
├─ 20 approved assets
├─ Include images (50MB total)
├─ Include captions (JSON)
├─ Include ad copy (JSON)
├─ Include scoring (JSON)
└─ Total ZIP ~60MB

Expected Result:
├─ ZIP creation starts immediately
├─ ZIP ready for download: <30 seconds
├─ Download starts: <1 second
├─ Download completes at network speed
└─ ZIP not corrupted

Measurements:
├─ ZIP creation time
├─ Download speed
├─ ZIP file integrity
└─ No timeouts
```

### Performance Test 3: UI Responsiveness

**Objective:** Ensure UI remains responsive during heavy operations

```
Test Scenario:
├─ 20 assets in Review Grid
├─ User scrolling through grid
├─ Generation running in background
├─ Export in progress

Expected Result:
├─ Grid scrolls smoothly (60fps)
├─ Buttons respond immediately
├─ No UI freezing
├─ Progress updates visible
└─ Can cancel operation

Measurements:
├─ Frame rate (target: 60fps)
├─ Button response time (<100ms)
├─ Scroll smoothness
└─ No jank or stuttering
```

### Load Test: Multiple Concurrent Users

**Objective:** Verify system handles multiple simultaneous users

```
Test Setup:
├─ Simulate 5 users
├─ Each user:
│  ├─ Login
│  ├─ Create campaign
│  ├─ Upload 5 assets
│  ├─ Generate captions
│  └─ Export
└─ All starting simultaneously

Expected Result:
├─ All users can login
├─ All campaigns created separately
├─ All uploads complete
├─ All generations complete
├─ All exports succeed
├─ No data mixing between users
├─ No server crashes
└─ Response times <2 seconds

Measurements:
├─ Success rate: 100%
├─ Error rate: 0%
├─ Average response time
├─ Server CPU usage
├─ Database connections
└─ Memory usage
```

---

## 🔒 SECURITY TESTING

### Security Test 1: Authentication & Authorization

```
Test 1.1: SQL Injection in Login
├─ Email field: test@example.com' OR '1'='1
├─ Expected: Login fails, error message shown
└─ VERIFY: SQL injection not possible

Test 1.2: Cross-Site Scripting (XSS)
├─ Campaign name: <script>alert('XSS')</script>
├─ Expected: Stored as text, not executed
├─ Check rendered HTML: Script tags escaped
└─ VERIFY: No XSS vulnerability

Test 1.3: Unauthorized Access
├─ User A creates campaign
├─ User B tries to access directly: /agency/workspaces/A_ID/campaigns/A_CAMPAIGN
├─ Expected: 403 Forbidden
└─ VERIFY: Access denied

Test 1.4: CSRF Protection
├─ Attempt POST request without CSRF token
├─ Expected: 403 Forbidden
└─ VERIFY: CSRF protection working

Test 1.5: Session Hijacking
├─ Capture session cookie
├─ Try to use in different browser
├─ Expected: Session invalid (tied to browser/IP)
└─ VERIFY: Session not portable
```

### Security Test 2: Data Isolation

```
Test 2.1: Agency Data Isolation
├─ Agency A: Create workspace & campaign
├─ Agency B: Attempt to access Agency A's data
├─ Expected: 403 Forbidden
├─ Query directly: GET /campaigns (should only see own)
└─ VERIFY: Data properly scoped

Test 2.2: Workspace Privacy
├─ User in Workspace A
├─ Attempt to access Workspace B assets
├─ Expected: 403 Forbidden
└─ VERIFY: Workspace isolation working

Test 2.3: File Upload Validation
├─ Upload executable file (.exe)
├─ Expected: 400 Bad Request
├─ Upload oversized file (100MB)
├─ Expected: 413 Payload Too Large
└─ VERIFY: Validation enforced
```

### Security Test 3: API Security

```
Test 3.1: Rate Limiting
├─ Send 100 requests to /login in 1 minute
├─ Expected: After N requests, 429 Too Many Requests
└─ VERIFY: Rate limiting working

Test 3.2: Input Validation
├─ POST /campaigns with name: "" (empty)
├─ Expected: 400 Bad Request, validation error
├─ POST with name: 1000+ characters
├─ Expected: 400 Bad Request, length validation
└─ VERIFY: Input validation enforced

Test 3.3: API Key Security (if applicable)
├─ Check if API keys in response
├─ Expected: Never in response body
├─ Check response headers
├─ Expected: No sensitive info
└─ VERIFY: Secure response handling
```

---

## 📱 MOBILE & RESPONSIVE TESTING

### Mobile Test 1: iPhone 12 (390x844)

```
Login Page:
├─ Form fields stack vertically
├─ Buttons full width
├─ Touch targets ≥44px
└─ Text readable without zoom

Workspaces List:
├─ Grid becomes 1 column on mobile
├─ Touch-friendly spacing
├─ No horizontal scroll
└─ Tap workspace works smoothly

Campaign Detail:
├─ Tabs accessible (swipe or buttons)
├─ Upload zone touch-friendly
├─ Preview readable
└─ Asset thumbnails scaled appropriately

Review Grid:
├─ Grid becomes 1 column on mobile
├─ Captions readable (font ≥16px)
├─ Approve/reject buttons easy to tap
├─ Scroll through all items
└─ Export works on mobile

VERDICT: 🔴 Test
```

### Mobile Test 2: Android Phone (412x915)

```
Same tests as iPhone 12

Special Android Considerations:
├─ Back button handling
├─ Navigation drawer (if used)
├─ File upload from camera
└─ Download file handling

VERDICT: 🔴 Test
```

### Tablet Test: iPad Pro (1024x1366)

```
Layout Adjustments:
├─ Grid becomes 2-3 columns
├─ Larger touch targets
├─ Side-by-side layout possible
├─ Full keyboard support
└─ Landscape/portrait both work

VERDICT: 🔴 Test
```

---

## 🧪 REGRESSION TEST SUITE

### Critical Path Tests (Run After Every Deploy)

| Test #  | Test Name         | Steps                          | Expected                 | Status |
| ------- | ----------------- | ------------------------------ | ------------------------ | ------ |
| **R-1** | Login             | Email + password + submit      | Redirect to workspaces   | 🔴     |
| **R-2** | View Workspaces   | Navigate to /agency/workspaces | All workspaces displayed | 🔴     |
| **R-3** | Create Campaign   | New campaign form + submit     | Campaign appears in list | 🔴     |
| **R-4** | Upload Assets     | Drag-drop 5 files              | All upload successfully  | 🔴     |
| **R-5** | Generate Captions | Click generate                 | 15 captions with scores  | 🔴     |
| **R-6** | Review & Approve  | Go to review grid, approve     | Checkmarks appear        | 🔴     |
| **R-7** | Export ZIP        | Click export, select content   | ZIP downloads            | 🔴     |
| **R-8** | Logout            | Click logout in header         | Redirect to login        | 🔴     |

---

**Next:** See **Part 4** for Known Issues, Bugs & Debugging Guide  
**Previous:** See **Part 1** for Pages & Routes  
**Previous:** See **Part 2** for Features & Workflows
