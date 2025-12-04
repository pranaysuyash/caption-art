# Complete Testing Guide - Part 2: Features, Workflows & User Flows

**Document Version:** 1.0  
**Created:** December 4, 2025  
**Status:** Active Testing Guide  
**Audience:** QA Engineers, Feature Testers, Developers

---

## 📑 TABLE OF CONTENTS

1. [Feature Inventory](#feature-inventory)
2. [Core Workflows](#core-workflows)
3. [Feature-Specific Workflows](#feature-specific-workflows)
4. [Data Flow Diagrams](#data-flow-diagrams)
5. [Integration Points](#integration-points)

---

## 🎯 FEATURE INVENTORY

### Summary: 42 Total Endpoints Across 8 Core Features

| Feature                    | Endpoints | Status      | Priority | Tested |
| -------------------------- | --------- | ----------- | -------- | ------ |
| **Authentication**         | 4         | ✅ Complete | MUST     | 🔴     |
| **Workspaces**             | 5         | ✅ Complete | MUST     | 🔴     |
| **Brand Kits**             | 5         | ✅ Complete | MUST     | 🔴     |
| **Campaigns**              | 8         | ✅ Complete | MUST     | 🔴     |
| **Asset Management**       | 5         | ✅ Complete | MUST     | 🔴     |
| **Caption Generation**     | 4         | ✅ Complete | MUST     | 🔴     |
| **Ad Creative Generation** | 6         | ✅ Complete | SHOULD   | 🔴     |
| **Approval & Export**      | 6         | ✅ Complete | MUST     | 🔴     |

---

## 🔄 CORE WORKFLOWS

### Workflow 1: Complete Agency Campaign Workflow

**Duration:** ~12 minutes end-to-end  
**Success Criteria:** All steps complete, assets approved, exported as ZIP

```
STEP 1: WORKSPACE SETUP (1 min)
┌────────────────────────────────┐
│ 1.1 Login to platform          │
│ 1.2 Navigate to /agency/*      │
│ 1.3 Create or select workspace │
│ 1.4 Create brand kit           │
│     - Add colors (3)           │
│     - Add fonts (heading+body) │
│     - Add logo position        │
│     - Set voice/personality   │
└────────────────────────────────┘
         Verification: Brand kit created & saved

STEP 2: CAMPAIGN CREATION (2 min)
┌────────────────────────────────┐
│ 2.1 Click "New Campaign"       │
│ 2.2 Fill campaign details:     │
│     - Name                     │
│     - Objective                │
│     - Target audience          │
│     - Campaign brief           │
│ 2.3 Attach reference creatives │
│ 2.4 Save campaign              │
└────────────────────────────────┘
         Verification: Campaign appears in list

STEP 3: ASSET UPLOAD (2 min)
┌────────────────────────────────┐
│ 3.1 Go to Campaign Detail      │
│ 3.2 Navigate to Assets section │
│ 3.3 Upload images (5-20)       │
│     - Drag-drop or browse      │
│     - Validate file type       │
│     - Check file size (50MB)   │
│ 3.4 Verify all uploaded        │
│ 3.5 Confirm upload complete    │
└────────────────────────────────┘
         Verification: All assets shown with thumbnails

STEP 4: GENERATION (3 min)
┌────────────────────────────────┐
│ 4.1 Configure generation:      │
│     - Select tone/style        │
│     - Set variations (3)       │
│     - Choose platforms         │
│ 4.2 Click "Generate"           │
│ 4.3 Monitor batch job progress │
│ 4.4 Wait for completion        │
│ 4.5 View scoring results       │
└────────────────────────────────┘
         Verification: Captions generated with scores

STEP 5: REVIEW & APPROVAL (3 min)
┌────────────────────────────────┐
│ 5.1 Go to Review Grid          │
│ 5.2 For each asset:            │
│     - View caption options     │
│     - Read scoring info        │
│     - Approve best option      │
│     - OR edit manually         │
│ 5.3 Select approved items      │
│ 5.4 Batch approve if needed    │
└────────────────────────────────┘
         Verification: Captions marked approved/rejected

STEP 6: EXPORT (1 min)
┌────────────────────────────────┐
│ 6.1 Click Export button        │
│ 6.2 Choose export format (ZIP) │
│ 6.3 Select what to include:    │
│     - Images + captions ✓      │
│     - Ad copy ✓                │
│     - Scoring ✓                │
│ 6.4 Click Download             │
│ 6.5 Receive ZIP file           │
└────────────────────────────────┘
         Verification: ZIP file downloaded successfully

FINAL OUTCOME:
✅ Campaign completed
✅ 20+ assets with approved captions
✅ Ad copy generated (headlines, body, CTAs)
✅ ZIP file ready for distribution
```

### Workflow 2: Quick Caption Generation (Playground)

**Duration:** ~2 minutes  
**Success Criteria:** Caption generated, copied to clipboard, saved to gallery

```
STEP 1: ACCESS PLAYGROUND (0.2 min)
┌─────────────────────────────┐
│ Navigate to /playground     │
│ No authentication required  │
│ Page loads with hero section│
└─────────────────────────────┘

STEP 2: UPLOAD IMAGE (0.5 min)
┌─────────────────────────────┐
│ Click upload zone           │
│ Select image (jpg/png)      │
│ Image preview shown         │
└─────────────────────────────┘

STEP 3: SELECT STYLE (0.3 min)
┌─────────────────────────────┐
│ 6 style buttons available:  │
│ - Creative (default)        │
│ - Funny                     │
│ - Poetic                    │
│ - Minimal                   │
│ - Dramatic                  │
│ - Quirky                    │
│ Click desired style         │
└─────────────────────────────┘

STEP 4: GENERATE (1 min)
┌─────────────────────────────┐
│ Click "Generate Caption"    │
│ Show loading bar            │
│ Wait for API response       │
│ Display generated caption   │
└─────────────────────────────┘

STEP 5: ACTIONS (varies)
┌─────────────────────────────┐
│ Copy to clipboard (toast)   │
│ Download as image           │
│ Share on social media       │
│ Regenerate for new variant  │
│ Clear & start over          │
└─────────────────────────────┘

STEP 6: GALLERY REVIEW
┌─────────────────────────────┐
│ All generated captions      │
│ stored in local gallery     │
│ Switch to Gallery view      │
│ See recent creations        │
│ Clear all (with confirm)    │
└─────────────────────────────┘

FINAL OUTCOME:
✅ Caption generated for chosen style
✅ Caption usable (copied/downloaded)
✅ Saved to recent gallery
```

---

## 📋 FEATURE-SPECIFIC WORKFLOWS

### Feature 1: Brand Kit Builder

**Endpoints:** 5 (GET list, POST create, GET detail, PUT update, DELETE)  
**Supported Fields:** Colors, fonts, logo position, voice, personality

#### Workflow: Create & Apply Brand Kit

```
Step 1: Open Brand Kit Manager
├─ From workspace settings
└─ Show list of brand kits

Step 2: Create New Brand Kit
├─ Click "+ New Brand Kit"
├─ Modal opens with form
└─ Fields:
   ├─ Name (required)
   ├─ Colors:
   │  ├─ Primary color (picker)
   │  ├─ Secondary color (picker)
   │  └─ Accent color (picker)
   ├─ Typography:
   │  ├─ Heading font (select)
   │  └─ Body font (select)
   ├─ Logo:
   │  ├─ Upload logo image
   │  └─ Position selector (corner/center)
   ├─ Voice Profile:
   │  ├─ Tone (formal, casual, professional)
   │  ├─ Personality traits (fun, serious, creative)
   │  ├─ Preferred phrases (text area)
   │  └─ Forbidden phrases (text area)
   └─ Target Audience (text)

Step 3: Save Brand Kit
├─ POST /brandKits (with all fields)
├─ Validation:
│  ├─ Name required
│  ├─ At least 1 color selected
│  └─ Font selection valid
└─ Success: Brand kit ID created

Step 4: Apply to Campaign
├─ When creating campaign
├─ Select brand kit from dropdown
├─ Brand kit used in generation
└─ Captions follow brand voice

Step 5: Edit/Update Brand Kit
├─ PUT /brandKits/:id
├─ Change any field
└─ Updates propagate to new generations

Step 6: Delete Brand Kit
├─ DELETE /brandKits/:id
├─ Warning if in use
└─ Cannot delete if campaign references it
```

#### Test Cases

| #        | Scenario               | Expected Result                 | Status |
| -------- | ---------------------- | ------------------------------- | ------ |
| **BK-1** | Create with all fields | Brand kit created, ID returned  | 🔴     |
| **BK-2** | Create without name    | Validation error shown          | 🔴     |
| **BK-3** | Create without colors  | Validation error shown          | 🔴     |
| **BK-4** | Edit brand kit         | Changes saved and applied       | 🔴     |
| **BK-5** | Delete brand kit       | Deleted from list               | 🔴     |
| **BK-6** | Apply to campaign      | Captions follow brand voice     | 🔴     |
| **BK-7** | Multiple brand kits    | Each has own settings           | 🔴     |
| **BK-8** | Brand kit in dropdown  | Selectable on campaign creation | 🔴     |

---

### Feature 2: Asset Upload & Management

**Endpoints:** 5 (POST upload, GET list by workspace, GET by ID, DELETE, etc.)  
**Constraints:** 20 files max, 50MB each, image/video only

#### Workflow: Upload & Manage Assets

```
Step 1: Navigate to Assets Manager
├─ In Campaign Detail page
├─ Click "Assets" tab
└─ Show upload zone + current assets

Step 2: Upload Assets
├─ METHOD 1: Drag-drop files
│  ├─ Files appear in upload zone
│  ├─ Show progress bar per file
│  └─ Auto-start upload
├─ METHOD 2: Click to browse
│  ├─ File dialog opens
│  ├─ Select single or multiple
│  └─ Auto-start upload
└─ VALIDATIONS:
   ├─ File type check (jpg/png/mp4/webm)
   ├─ File size check (<50MB each)
   ├─ Total count check (<20 per campaign)
   └─ Show error toast if validation fails

Step 3: Upload Progress
├─ Show individual progress per file
├─ Show overall progress
├─ Allow cancel during upload
└─ Display upload speed

Step 4: Confirm Upload
├─ All files shown with thumbnails
├─ File metadata shown (name, size, type)
├─ Show "Upload Complete" message
└─ Enable "Generate" button

Step 5: Manage Assets
├─ Hover to show:
│  ├─ Preview button
│  ├─ Delete button (❌)
│  └─ File info
├─ Click delete → Confirm modal
├─ Click remove → DELETE /assets/:id
└─ Asset removed from list

Step 6: Re-upload
├─ Can upload more files later
├─ Count against 20 limit
├─ Delete old ones to make room
└─ New uploads trigger new generation
```

#### Test Cases

| #         | Scenario              | Expected Result                | Status |
| --------- | --------------------- | ------------------------------ | ------ |
| **AM-1**  | Upload 1 image        | File appears in list           | 🔴     |
| **AM-2**  | Upload 5 images       | All appear with progress bars  | 🔴     |
| **AM-3**  | Upload 20 images      | All accepted (at limit)        | 🔴     |
| **AM-4**  | Upload 21st image     | Error: "At upload limit"       | 🔴     |
| **AM-5**  | Upload >50MB file     | Error: "File too large"        | 🔴     |
| **AM-6**  | Upload .exe file      | Error: "Invalid file type"     | 🔴     |
| **AM-7**  | Cancel upload         | Upload stops, file not saved   | 🔴     |
| **AM-8**  | Delete asset          | Asset removed, count decreases | 🔴     |
| **AM-9**  | Drag-drop 3 files     | All upload simultaneously      | 🔴     |
| **AM-10** | Delete then re-upload | New file replaces old one      | 🔴     |

---

### Feature 3: Caption Generation (Batch)

**Endpoints:** 4 (POST /caption/batch, GET /caption/batch/:jobId, templates, etc.)  
**Generates:** 3 variations per asset with scores

#### Workflow: Generate Captions

```
Step 1: Configure Generation
├─ Go to Campaign Detail
├─ Assets uploaded ✓
├─ Click "Generate Captions"
└─ Configuration modal:
   ├─ Caption style/tone
   ├─ Number of variations (default: 3)
   ├─ Platform targeting (Instagram/TikTok/LinkedIn)
   ├─ Include hashtags (yes/no)
   ├─ Language (English default)
   └─ [Submit] button

Step 2: Start Batch Job
├─ POST /caption/batch with:
│  ├─ assetIds: [...]
│  ├─ campaignId: <id>
│  ├─ variations: 3
│  ├─ tone: "creative"
│  └─ platforms: ["instagram", "tiktok"]
├─ Backend returns jobId
└─ Show progress tracking page

Step 3: Monitor Progress
├─ Poll GET /caption/batch/:jobId
├─ Show:
│  ├─ Overall progress (X/20 assets)
│  ├─ Current asset processing
│  ├─ Estimated time remaining
│  ├─ Processing status
│  └─ [Cancel] button (if needed)
└─ Auto-refresh every 2 seconds

Step 4: Completion
├─ Job completes (all assets done)
├─ Show results with scoring:
│  ├─ Asset thumbnail
│  ├─ 3 caption options
│  ├─ Score per caption:
│  │  ├─ Clarity (0-100)
│  │  ├─ Originality (0-100)
│  │  ├─ Brand consistency (0-100)
│  │  └─ Platform relevance (0-100)
│  └─ Average score shown
└─ [Go to Review] button activated

Step 5: View Results
├─ Can scroll through captions
├─ See all scoring breakdown
├─ Compare alternatives
├─ Or proceed to Review Grid
```

#### Test Cases

| #         | Scenario              | Expected Result                      | Status |
| --------- | --------------------- | ------------------------------------ | ------ |
| **CG-1**  | Generate 1 asset      | 3 captions generated with scores     | 🔴     |
| **CG-2**  | Generate 20 assets    | 60 captions (3×20) with scores       | 🔴     |
| **CG-3**  | Change tone           | Captions have different tone         | 🔴     |
| **CG-4**  | Monitor progress      | Progress bar updates smoothly        | 🔴     |
| **CG-5**  | Cancel job            | Job stops, partial results discarded | 🔴     |
| **CG-6**  | Job timeout (>5min)   | Show error with retry option         | 🔴     |
| **CG-7**  | API error (OpenAI)    | Show error, retry button             | 🔴     |
| **CG-8**  | No assets             | Show error "Upload assets first"     | 🔴     |
| **CG-9**  | Different platforms   | Captions vary by platform            | 🔴     |
| **CG-10** | Regenerate after edit | New captions generated               | 🔴     |

---

### Feature 4: Mask Generation

**Endpoints:** 1 (POST /mask)  
**Purpose:** Background removal for text-behind visual effect

#### Workflow: Generate Mask

```
Step 1: Access Mask Generator
├─ In Campaign Detail or Playground
├─ Advanced panel (if applicable)
└─ Select asset for masking

Step 2: Generate Mask
├─ Click "Generate Mask" button
├─ POST /mask with assetId
├─ Show progress indicator
└─ Wait for completion

Step 3: Preview Mask
├─ Display mask image (black background, white foreground)
├─ Show preview of text overlay
├─ Toggle between original and masked
└─ Accept or reject

Step 4: Apply to Design
├─ Use mask in text placement
├─ Text renders behind subject
├─ Can adjust text color/position
└─ Preview updates

Step 5: Export with Mask
├─ When exporting, include masked version
├─ Multiple versions in ZIP
└─ Can choose which to use
```

#### Test Cases

| #        | Scenario                | Expected Result                         | Status |
| -------- | ----------------------- | --------------------------------------- | ------ |
| **MG-1** | Generate mask for image | Mask created (white subject, black BG)  | 🔴     |
| **MG-2** | Generate mask for video | Error or extract frame first            | 🔴     |
| **MG-3** | Low contrast image      | Mask still generated (may be imperfect) | 🔴     |
| **MG-4** | API timeout             | Show error with retry                   | 🔴     |
| **MG-5** | Large file              | Mask generation handles it              | 🔴     |
| **MG-6** | Apply mask to design    | Text renders correctly behind subject   | 🔴     |

---

### Feature 5: Approval & Export

**Endpoints:** 6 (Approval CRUD, Export endpoints)  
**Purpose:** Review captions and export as structured ZIP

#### Workflow: Approve & Export

```
Step 1: Review Grid Page
├─ Show all assets in grid layout
├─ Each asset card contains:
│  ├─ Thumbnail image
│  ├─ Multiple caption options
│  ├─ Star ratings/scores
│  └─ Action buttons
└─ Responsive layout (2-3 columns)

Step 2: Review Individual Items
├─ For each asset:
│  ├─ Read captions
│  ├─ Check scores
│  ├─ Select best option
│  └─ Or edit manually

Step 3: Approve Item
├─ Click "✓ Approve" button
├─ Mark caption as APPROVED
├─ Move to approved list
├─ Best-rated gets default selection
└─ Show checkmark on card

Step 4: Reject Item
├─ Click "✗ Reject" button
├─ Mark caption as REJECTED
├─ Remove from export
├─ Show rejection state
└─ Can undo if needed

Step 5: Edit Caption
├─ Click "✏️ Edit" button
├─ Text becomes editable
├─ Make changes
├─ Click save/confirm
└─ Updated caption saved

Step 6: Batch Selection
├─ Checkboxes on each card
├─ Select multiple items
├─ Bulk approve button
├─ Bulk reject button
└─ Batch operations apply to all

Step 7: Export Setup
├─ Click "📦 Export" button
├─ Choose format (ZIP)
├─ Select what to include:
│  ├─ [x] Images + Captions
│  ├─ [x] Ad Copy (headlines, body, CTA)
│  ├─ [x] Scoring Data
│  └─ [ ] RAW data export
└─ [Download] button

Step 8: Generate ZIP
├─ Backend packages:
│  ├─ /images/ - all asset images
│  ├─ /captions/ - approved captions per image
│  ├─ /ad-copy/ - headlines, body, CTA
│  ├─ manifest.json - metadata
│  └─ scoring.json - all scores
├─ Show download progress
└─ Download starts automatically

Step 9: Post-Download
├─ Show success message
├─ Display file size
├─ Provide re-download link
├─ Show export history
└─ Option to export again
```

#### Test Cases

| #         | Scenario             | Expected Result                      | Status |
| --------- | -------------------- | ------------------------------------ | ------ |
| **AP-1**  | Approve 1 caption    | Marked approved, checkmark shown     | 🔴     |
| **AP-2**  | Reject 1 caption     | Marked rejected, removed from export | 🔴     |
| **AP-3**  | Edit caption         | Text updated in review grid          | 🔴     |
| **AP-4**  | Batch approve 10     | All 10 marked approved               | 🔴     |
| **AP-5**  | Export 20 captions   | ZIP created with all content         | 🔴     |
| **AP-6**  | ZIP structure        | All folders/files present            | 🔴     |
| **AP-7**  | Ad copy in ZIP       | Headline, body, CTA present          | 🔴     |
| **AP-8**  | Scoring in ZIP       | JSON with all scores                 | 🔴     |
| **AP-9**  | Large export (500MB) | Handles without timeout              | 🔴     |
| **AP-10** | Re-download          | Can download same export again       | 🔴     |

---

## 📊 DATA FLOW DIAGRAMS

### Data Flow 1: Campaign Creation to Export

```
User Input
    ↓
┌─────────────────────────────┐
│ Campaign Creation           │
│ POST /campaigns             │
└────────────┬────────────────┘
             ↓
┌─────────────────────────────┐
│ Asset Upload                │
│ POST /assets/upload (x20)   │
│ Files stored in /uploads/   │
└────────────┬────────────────┘
             ↓
┌─────────────────────────────┐
│ Batch Caption Generation    │
│ POST /caption/batch         │
│ Calls OpenAI GPT-3.5 API    │
│ Gets 3 variants per asset   │
│ Scoring applied             │
└────────────┬────────────────┘
             ↓
┌─────────────────────────────┐
│ Generate Masks (Optional)   │
│ POST /mask                  │
│ Calls Replicate rembg       │
└────────────┬────────────────┘
             ↓
┌─────────────────────────────┐
│ Review & Approval           │
│ Manual review in grid       │
│ Select best captions        │
│ Edit if needed              │
└────────────┬────────────────┘
             ↓
┌─────────────────────────────┐
│ Ad Copy Generation          │
│ POST /adCreatives           │
│ Generates headlines, body   │
│ CTAs for each asset         │
└────────────┬────────────────┘
             ↓
┌─────────────────────────────┐
│ Export & Package            │
│ POST /batch or export       │
│ Create ZIP structure        │
│ Include all content         │
└────────────┬────────────────┘
             ↓
    ZIP File Download
```

### Data Flow 2: Authentication & Session

```
Client                           Backend
  │                                │
  │──POST /auth/login────────────>│
  │                              │
  │  Validate credentials        │
  │  Hash password with bcrypt   │
  │  Create session              │
  │  Set HTTP-only cookie        │
  │                              │
  │<────Session Cookie───────────│
  │                              │
  │──GET /api/workspaces────────>│
  │  (with cookie)               │
  │                              │
  │  Verify session              │
  │  Get agency_id from session  │
  │  Filter data by agency       │
  │                              │
  │<────Workspaces JSON──────────│
  │                              │
  │──POST /auth/logout──────────>│
  │                              │
  │  Clear session               │
  │  Clear cookie                │
  │                              │
  │<────Success────────────────│
```

---

## 🔗 INTEGRATION POINTS

### Integration 1: Frontend → Backend API

**Base URL:** `http://localhost:3001/api`

#### Authentication Endpoints

```
POST /auth/signup
├─ Body: { email, password }
└─ Response: { userId, agencyId, sessionId }

POST /auth/login
├─ Body: { email, password }
└─ Response: { userId, agencyId, sessionId }
│           → HTTP-only cookie set

GET /auth/me
├─ Headers: Cookie (HTTP-only)
└─ Response: { userId, email, agencyId }

POST /auth/logout
├─ Headers: Cookie
└─ Response: { success: true }
```

#### Workspace Endpoints

```
GET /workspaces
├─ Headers: Cookie (auth required)
├─ Query: { page, limit, search }
└─ Response: { workspaces: [...], total }

POST /workspaces
├─ Body: { name, description }
└─ Response: { id, name, agencyId, ... }

GET /workspaces/:id
├─ Response: { id, name, campaigns, assets, ... }

PUT /workspaces/:id
├─ Body: { name, description }
└─ Response: { updated workspace }

DELETE /workspaces/:id
├─ Response: { success: true }
```

#### Campaign Endpoints

```
POST /campaigns
├─ Body: { workspaceId, name, objective, targetAudience, brandKitId, brief }
└─ Response: { campaignId, ... }

GET /campaigns
├─ Query: { workspaceId, status }
└─ Response: { campaigns: [...] }

PUT /campaigns/:id
├─ Body: { name, objective, brief, ... }
└─ Response: { updated campaign }

PATCH /campaigns/:id/launch
├─ Body: {}
└─ Response: { status: "active" }

PATCH /campaigns/:id/pause
├─ Body: {}
└─ Response: { status: "paused" }
```

#### Asset Endpoints

```
POST /assets/upload
├─ Body: FormData with file
├─ Headers: multipart/form-data
└─ Response: { assetId, url, type, size }

GET /assets/workspace/:workspaceId
├─ Response: { assets: [...] }

GET /assets/:id
├─ Response: { id, url, type, metadata }

DELETE /assets/:id
├─ Response: { success: true }
```

#### Caption Generation

```
POST /caption/batch
├─ Body: { assetIds, campaignId, variations, tone, platforms }
└─ Response: { jobId }

GET /caption/batch/:jobId
├─ Response: { status, progress, results: [...] }

POST /caption
├─ Body: { assetId, tone, count }
└─ Response: { captions: [...] }

GET /caption/templates
├─ Response: { templates: [...] }
```

### Integration 2: Frontend Components → API Calls

#### Component: WorkspaceList

```
Mounted:
  1. GET /workspaces
  2. Parse response
  3. Render workspace cards

User clicks workspace:
  1. GET /workspaces/:id
  2. Store in context
  3. Navigate to campaigns page

User creates workspace:
  1. Validate form
  2. POST /workspaces
  3. Add to list
  4. Show success toast
```

#### Component: CampaignDetail

```
Mounted:
  1. GET /campaigns/:id
  2. Load campaign data
  3. Load associated assets
  4. Display form

User uploads assets:
  1. Validate files
  2. POST /assets/upload
  3. Update asset list
  4. Enable generate button

User generates captions:
  1. POST /caption/batch
  2. Poll GET /caption/batch/:jobId every 2s
  3. Show progress
  4. Display results when complete
  5. Enable review button
```

#### Component: ReviewGrid

```
Mounted:
  1. GET /caption/batch/:jobId (get all captions)
  2. Get approval status
  3. Render grid

User approves caption:
  1. Update local state
  2. Mark as APPROVED
  3. Enable export button

User exports:
  1. POST /batch or export endpoint
  2. Generate ZIP
  3. Download to client
  4. Show success
```

### Integration 3: Backend → External APIs

#### OpenAI Integration

```
When: POST /caption/batch received
├─ For each asset:
│  ├─ Call OpenAI GPT-3.5 Turbo
│  ├─ Prompt includes brand voice
│  ├─ Get 3 variations
│  ├─ Parse response
│  └─ Store in DB
├─ After all: Apply scoring
└─ Update job status to COMPLETE

Error handling:
├─ Timeout → Retry up to 3x
├─ Rate limit → Queue for later
├─ Auth fail → Log error, notify user
└─ Invalid response → Use fallback
```

#### Replicate Integration (Mask Generation)

```
When: POST /mask received
├─ Get asset file
├─ Call Replicate rembg API
├─ Receive mask binary
├─ Store mask file
├─ Return mask URL
└─ Update asset metadata

Error handling:
├─ No subject detected → Retry or notify
├─ API down → Show error, suggest later
└─ Large file → Resize first
```

---

## ✅ INTEGRATION TESTING CHECKLIST

### API Response Validation

- [ ] All endpoints return correct HTTP status codes (200, 201, 400, 401, 404, 500)
- [ ] Response bodies match schema
- [ ] Error messages are descriptive
- [ ] Pagination works (limit, offset)
- [ ] Filtering works (status, search)
- [ ] Sorting works (by date, name)

### Data Persistence

- [ ] Data saved to SQLite (development)
- [ ] Data persists after refresh
- [ ] Database transactions working
- [ ] Foreign key relationships intact
- [ ] Cascade deletes work (workspace delete removes campaigns)
- [ ] Unique constraints enforced

### External API Integration

- [ ] OpenAI API calls succeed (proper formatting)
- [ ] Replicate API calls succeed (rembg)
- [ ] Timeout handling works
- [ ] Rate limiting handled
- [ ] Error responses caught and logged
- [ ] Fallback behavior works

### Performance

- [ ] Caption generation completes <5 minutes for 20 assets
- [ ] Export ZIP completes <30 seconds
- [ ] API response time <500ms for most endpoints
- [ ] File upload speeds reasonable (>1MB/s)
- [ ] Grid rendering smooth (60fps on desktop)

---

**Next:** See **Part 3** for Complete Use Cases & Detailed Testing Scenarios  
**Next:** See **Part 4** for Known Issues & Debugging Guide
