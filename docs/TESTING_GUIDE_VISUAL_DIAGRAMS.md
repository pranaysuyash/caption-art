# Complete Testing Guide - Visual Diagrams & Maps

**Document Version:** 1.0  
**Created:** December 4, 2025  
**Status:** Visual Reference Guide  
**Audience:** Visual learners, architects, team leads

---

## 🗺️ SYSTEM ARCHITECTURE DIAGRAM

```
┌─────────────────────────────────────────────────────────────────┐
│                      USER BROWSER                               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │               React Frontend (Vite)                      │   │
│  │  http://localhost:5173                                  │   │
│  │                                                          │   │
│  │  ┌─ Login Page                                          │   │
│  │  ├─ Playground Page (public)                           │   │
│  │  └─ Agency Routes (protected)                          │   │
│  │     ├─ WorkspaceList                                   │   │
│  │     ├─ CampaignList                                    │   │
│  │     ├─ CampaignDetail                                  │   │
│  │     └─ ReviewGrid                                      │   │
│  └──────────────────────────────────────────────────────────┘   │
│           ↓ HTTP (REST API)                ↑ JSON Response       │
└─────────────────────────────────────────────────────────────────┘
                          │
                          │ Port 3001
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│                    EXPRESS BACKEND                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  API Routes (42 endpoints)                              │   │
│  │                                                          │   │
│  │  ├─ /api/auth/...        (4 endpoints)                 │   │
│  │  ├─ /api/workspaces/...  (5 endpoints)                 │   │
│  │  ├─ /api/brandKits/...   (5 endpoints)                 │   │
│  │  ├─ /api/campaigns/...   (8 endpoints)                 │   │
│  │  ├─ /api/assets/...      (5 endpoints)                 │   │
│  │  ├─ /api/caption/...     (4 endpoints)                 │   │
│  │  ├─ /api/mask/...        (1 endpoint)                  │   │
│  │  ├─ /api/adCreatives/... (6 endpoints)                 │   │
│  │  └─ /api/batch/...       (4 endpoints)                 │   │
│  └──────────────────────────────────────────────────────────┘   │
│           ↓ SQL Queries             ↑ DB Results                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Prisma ORM (v6)                                        │   │
│  │  ├─ Database: SQLite (dev) / PostgreSQL (prod)         │   │
│  │  ├─ 14 Models (Users, Workspaces, Campaigns, etc)      │   │
│  │  └─ Automatic migrations                               │   │
│  └──────────────────────────────────────────────────────────┘   │
│           ↓ File System             ↑ File Paths                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  File Storage                                           │   │
│  │  ├─ /uploads/            (user assets)                 │   │
│  │  ├─ /exports/            (ZIP files)                   │   │
│  │  └─ app.sqlite           (SQLite database)             │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
           ↓ API Calls                           ↑ Results
┌──────────────────────────────────────────────────────────────────┐
│                    EXTERNAL APIs                                 │
│                                                                  │
│  ┌──────────────────────┐  ┌──────────────────────┐             │
│  │   OpenAI API         │  │   Replicate API      │             │
│  │  GPT-3.5 Turbo       │  │   rembg (masks)      │             │
│  │  For captions        │  │   Background removal │             │
│  └──────────────────────┘  └──────────────────────┘             │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🔀 COMPLETE USER WORKFLOW DIAGRAM

```
START: User Opens Application
  │
  ├─ Authenticated?
  │  ├─ YES → Go to /agency/workspaces
  │  └─ NO → Show /login
  │
  ├─ [1] LOGIN
  │  ├─ Email + Password
  │  ├─ POST /auth/login
  │  └─ Set session cookie
  │
  └─ [2] WORKSPACE MANAGEMENT
     ├─ View all workspaces (GET /workspaces)
     ├─ Create new (POST /workspaces)
     ├─ Edit workspace (PUT /workspaces/:id)
     └─ Navigate to campaigns
        │
        └─ [3] BRAND KIT SETUP
           ├─ View brand kits (GET /brandKits)
           ├─ Create brand kit (POST /brandKits)
           │  ├─ Colors (3)
           │  ├─ Fonts (2)
           │  ├─ Logo
           │  └─ Voice profile
           └─ Save & select
              │
              └─ [4] CAMPAIGN CREATION
                 ├─ Create campaign (POST /campaigns)
                 │  ├─ Name
                 │  ├─ Objective
                 │  ├─ Target audience
                 │  ├─ Brand kit reference
                 │  ├─ Campaign brief
                 │  └─ Reference creatives (optional)
                 └─ Open campaign detail
                    │
                    └─ [5] ASSET UPLOAD
                       ├─ Upload images/videos (1-20)
                       │  └─ POST /assets/upload
                       ├─ Validation:
                       │  ├─ File type (jpg/png/mp4/webm)
                       │  ├─ File size (<50MB each)
                       │  └─ Count limit (≤20)
                       ├─ Show upload progress
                       └─ Display thumbnails
                          │
                          └─ [6] CAPTION GENERATION
                             ├─ Configure settings:
                             │  ├─ Style/Tone
                             │  ├─ Variations (3)
                             │  └─ Platforms
                             ├─ POST /caption/batch
                             ├─ Monitor progress
                             │  └─ Poll GET /caption/batch/:jobId
                             ├─ Wait for completion (~2-3 min)
                             └─ View results with scoring
                                │
                                ├─ [7] OPTIONAL: MASK GENERATION
                                │  ├─ Select assets
                                │  ├─ POST /mask
                                │  ├─ Receive mask images
                                │  └─ Preview text overlay
                                │
                                └─ [8] AD COPY GENERATION
                                   ├─ Generate headlines, body, CTA
                                   ├─ POST /adCreatives
                                   └─ Review results
                                      │
                                      └─ [9] REVIEW & APPROVAL
                                         ├─ Go to Review Grid
                                         ├─ For each asset:
                                         │  ├─ View captions
                                         │  ├─ Check scoring
                                         │  ├─ Approve best option
                                         │  └─ OR edit manually
                                         ├─ Batch approve/reject
                                         └─ Mark items for export
                                            │
                                            └─ [10] EXPORT
                                               ├─ Click Export
                                               ├─ Configure:
                                               │  ├─ Format: ZIP
                                               │  ├─ Include images
                                               │  ├─ Include captions
                                               │  ├─ Include ad copy
                                               │  └─ Include scoring
                                               ├─ Generate ZIP
                                               ├─ Download file
                                               └─ SUCCESS ✓
```

---

## 🎯 FEATURE DEPENDENCY TREE

```
AUTHENTICATION
  ├─ Login (email/password)
  ├─ Session management
  └─ Logout
     ↓ (Required for all protected features)
     │
WORKSPACES (foundation)
  ├─ Create workspace
  ├─ Manage workspace
  ├─ Delete workspace
  └─ List workspaces
     ↓ (Required for all campaign features)
     │
BRAND KIT (optional, enhances)
  ├─ Create brand kit
  ├─ Select for campaign
  ├─ Update brand kit
  └─ Delete brand kit
     ↓ (Applied during generation)
     │
CAMPAIGN MANAGEMENT
  ├─ Create campaign
  ├─ Edit campaign
  ├─ Launch/pause campaign
  └─ Delete campaign
     ↓ (Required before assets)
     │
ASSET UPLOAD
  ├─ Upload files (1-20)
  ├─ Validate files
  ├─ Delete assets
  └─ Show thumbnails
     ↓ (Required for generation)
     │
     ├→ CAPTION GENERATION
     │  ├─ Configure tone/style
     │  ├─ Select platforms
     │  ├─ Call OpenAI API
     │  ├─ Get 3 variants per asset
     │  ├─ Apply scoring
     │  ├─ Apply brand voice
     │  └─ Display results
     │     ↓
     │     └→ REVIEW & APPROVAL
     │        ├─ View captions
     │        ├─ Approve/reject
     │        ├─ Edit inline
     │        ├─ Batch operations
     │        └─ Select for export
     │           ↓
     │           └→ EXPORT
     │              ├─ Generate ZIP
     │              ├─ Package content
     │              ├─ Include metadata
     │              └─ Download file
     │
     ├→ MASK GENERATION (optional)
     │  ├─ Select assets
     │  ├─ Call Replicate API
     │  ├─ Get mask images
     │  └─ Preview overlay
     │
     └→ AD CREATIVE GENERATION (optional)
        ├─ Generate headlines
        ├─ Generate body copy
        ├─ Generate CTAs
        └─ Include in export
```

---

## 📊 DATA FLOW DIAGRAM

```
┌────────────────┐
│  User Input    │
└────────┬───────┘
         │
         ▼
┌─────────────────────────────┐
│  Frontend (React)           │
├─────────────────────────────┤
│  1. Validate input          │
│  2. Format for API          │
│  3. Call API endpoint       │
└────────┬────────────────────┘
         │
         ▼ HTTP Request
    ┌────────────────────────────────┐
    │  Backend Route Handler         │
    ├────────────────────────────────┤
    │  1. Authenticate (session)     │
    │  2. Authorize (permissions)    │
    │  3. Validate request (Zod)     │
    │  4. Business logic             │
    └────────┬─────────────────────┬─┘
             │                     │
         SQL │                     │ External
             │                     │ API call
             ▼                     ▼
    ┌─────────────────┐  ┌──────────────────────┐
    │ SQLite/          │  │ OpenAI / Replicate   │
    │ PostgreSQL       │  │ (captions/masks)     │
    └────────┬─────────┘  └──────────┬───────────┘
             │                       │
             │ Data                  │ Results
             │ Retrieved             │ Returned
             ▼                       ▼
    ┌────────────────────────────────┐
    │  Backend Processors            │
    ├────────────────────────────────┤
    │  1. Process results            │
    │  2. Apply business rules       │
    │  3. Score captions            │
    │  4. Apply brand voice         │
    │  5. Package for export        │
    └────────┬─────────────────────┘
             │
             ▼ JSON Response
    ┌────────────────────────────────┐
    │  Frontend (React)              │
    ├────────────────────────────────┤
    │  1. Parse response             │
    │  2. Update state               │
    │  3. Re-render UI               │
    │  4. Display to user            │
    └────────┬─────────────────────┘
             │
             ▼
    ┌────────────────────────────────┐
    │  User Sees Results             │
    │  ✓ Data displayed              │
    │  ✓ Ready for action            │
    │  ✓ Next step available         │
    └────────────────────────────────┘
```

---

## 🔄 CAPTION GENERATION FLOW

```
User clicks "Generate Captions"
  │
  ├─ Validate: Assets exist?
  │  └─ If NO → Show error
  │
  ├─ Collect configuration:
  │  ├─ Style/tone
  │  ├─ Number of variations
  │  ├─ Platforms
  │  └─ Brand kit settings
  │
  ├─ Submit: POST /caption/batch
  │  └─ Response: { jobId }
  │
  ├─ Show: Progress UI
  │  ├─ "Generating captions..."
  │  ├─ Progress bar (0% → 100%)
  │  └─ Status: "Processing asset 1 of 10..."
  │
  ├─ Poll: GET /caption/batch/:jobId
  │  ├─ Every 2 seconds
  │  ├─ Update progress
  │  └─ Check status
  │
  ├─ Backend Processing:
  │  ├─ For each asset:
  │  │  ├─ Send to OpenAI API
  │  │  │  ├─ Include image/video
  │  │  │  ├─ Include brand voice
  │  │  │  ├─ Include tone/style
  │  │  │  └─ Request 3 variations
  │  │  │
  │  │  ├─ Receive captions (3x)
  │  │  ├─ Apply scoring:
  │  │  │  ├─ Clarity (0-100)
  │  │  │  ├─ Originality (0-100)
  │  │  │  ├─ Brand consistency (0-100)
  │  │  │  └─ Platform relevance (0-100)
  │  │  │
  │  │  └─ Store in database
  │  │     ├─ Save captions
  │  │     ├─ Save scores
  │  │     ├─ Link to campaign
  │  │     └─ Link to asset
  │  │
  │  ├─ Update job status: COMPLETED
  │  └─ Mark as ready for review
  │
  ├─ Poll result: status = "completed"
  │  ├─ Fetch all captions
  │  ├─ Get all scores
  │  └─ Stop polling
  │
  ├─ Frontend displays:
  │  ├─ All X assets in grid
  │  ├─ 3 captions per asset
  │  ├─ Scoring breakdown per caption
  │  ├─ Top-rated highlighted
  │  └─ [Go to Review] button
  │
  └─ User action:
     ├─ View captions (done)
     ├─ Edit captions (if needed)
     └─ Go to Review Grid
```

---

## 📱 NAVIGATION HIERARCHY

```
ROOT
│
├─ PUBLIC (/login)
│  └─ Login Page
│
├─ PUBLIC (/playground)
│  └─ Playground (legacy)
│
└─ PROTECTED (/agency/*)
   │
   ├─ /agency/workspaces
   │  ├─ WorkspaceList
   │  └─ [Click workspace] →
   │
   ├─ /agency/workspaces/:id/campaigns
   │  ├─ CampaignList
   │  └─ [Click campaign] →
   │
   ├─ /agency/workspaces/:id/campaigns/:cid
   │  ├─ CampaignDetail
   │  │  ├─ Info tab
   │  │  ├─ Assets tab
   │  │  ├─ Generate tab
   │  │  └─ Results tab
   │  └─ [Go to Review] →
   │
   └─ /agency/workspaces/:id/campaigns/:cid/review
      ├─ ReviewGrid
      └─ [Export] → Download ZIP
```

---

## 🎭 TEST SCENARIO MATRIX

```
                │ Happy Path │ Edge Case │ Error Case │ Performance
─────────────────────────────────────────────────────────────────
Login           │     ✓      │     ✓     │     ✓      │     ✓
Workspace Mgmt  │     ✓      │     ✓     │     ✓      │
Campaign Mgmt   │     ✓      │     ✓     │     ✓      │     ✓
Asset Upload    │     ✓      │     ✓     │     ✓      │     ✓
Caption Gen     │     ✓      │     ✓     │     ✓      │     ✓
Mask Gen        │     ✓      │     ✓     │     ✓      │
Review          │     ✓      │     ✓     │     ✓      │
Export          │     ✓      │     ✓     │     ✓      │     ✓
─────────────────────────────────────────────────────────────────
Coverage        │    100%    │    100%   │   70%      │    50%
```

---

## 🔐 SECURITY FLOW

```
User Request
  │
  ▼
┌────────────────────────────┐
│ 1. AUTHENTICATION          │
│ ├─ Check HTTP-only cookie  │
│ ├─ Verify session exists   │
│ ├─ Validate session token  │
│ └─ Extract user ID         │
└────────┬───────────────────┘
         │
    ┌────┴────┐
    │ Valid?  │
    └────┬────┘
         │
    ┌────▼─────┐
    YES       NO
    │          │
    ▼          ▼
 [Continue] [401 Unauthorized]
    │          │
    ▼          └─→ Redirect to /login
┌────────────────────────────┐
│ 2. AUTHORIZATION           │
│ ├─ Get user's agency ID    │
│ ├─ Check resource ownership│
│ │  (workspace/campaign/etc)│
│ └─ Verify permissions      │
└────────┬───────────────────┘
         │
    ┌────▼──────┐
    Authorized?
    │           │
    YES        NO
    │          │
    ▼          ▼
 [Continue] [403 Forbidden]
    │          │
    ▼          └─→ Reject request
┌────────────────────────────┐
│ 3. INPUT VALIDATION        │
│ ├─ Use Zod schemas         │
│ ├─ Type check all inputs   │
│ ├─ Sanitize strings        │
│ ├─ Validate file types     │
│ ├─ Check size limits       │
│ └─ Prevent injection       │
└────────┬───────────────────┘
         │
    ┌────▼──────┐
    Valid input?
    │           │
    YES        NO
    │          │
    ▼          ▼
 [Continue] [400 Bad Request]
    │          │
    ▼          └─→ Reject request
┌────────────────────────────┐
│ 4. PROCESSING              │
│ ├─ Database transactions   │
│ ├─ External API calls      │
│ ├─ Error handling          │
│ └─ Logging                 │
└────────┬───────────────────┘
         │
         ▼
    ┌─────────────────┐
    Success?
    │                 │
    YES              NO
    │                 │
    ▼                 ▼
[Response]      [Error Response]
[200/201]       [500]
```

---

## 📈 PERFORMANCE BENCHMARK TARGETS

```
OPERATION               METRIC              TARGET      STATUS
─────────────────────────────────────────────────────────────
Page Load               Time to Interactive  < 3 sec    ✓ Expected
Login                   Request time        < 500ms    ✓ Expected
Get Workspaces         Request time        < 500ms    ✓ Expected
Create Campaign        Request time        < 800ms    ✓ Expected
Upload 5 Assets        Upload time         < 30 sec   ✓ Expected
Generate Captions      Job time            < 3 min    ✓ Expected
Export ZIP (20 assets) Generation time     < 30 sec   ✓ Expected
UI Responsiveness      Frame rate          60 fps     ✓ Expected
Review Grid Scroll     Smoothness          60 fps     ? Needs test
─────────────────────────────────────────────────────────────
```

---

## 🎓 FEATURE MATURITY MATRIX

```
FEATURE               IMPLEMENTATION    TESTING    DOCUMENTATION   STATUS
─────────────────────────────────────────────────────────────────────────
Authentication       ✅ Complete       🔴 Needed  ✅ Complete      🟡 Ready
Workspaces          ✅ Complete       🔴 Needed  ✅ Complete      🟡 Ready
Brand Kits          ✅ Complete       🔴 Needed  ✅ Complete      🟡 Ready
Campaigns           ✅ Complete       🔴 Needed  ✅ Complete      🟡 Ready
Assets              ✅ Complete       🔴 Needed  ✅ Complete      🟡 Ready
Captions            ✅ Complete       🔴 Needed  ✅ Complete      🟡 Ready
Masks               ✅ Complete       🔴 Needed  ✅ Complete      🟡 Ready
Ad Creatives        ✅ Complete       🔴 Needed  ✅ Complete      🟡 Ready
Review & Approval   ✅ Complete       🔴 Needed  ✅ Complete      🟡 Ready
Export              ✅ Complete       🔴 Needed  ✅ Complete      🟡 Ready
─────────────────────────────────────────────────────────────────────────
OVERALL             ✅ 100% Complete  🔴 0%      ✅ 100% Complete ⚠️ Testing
─────────────────────────────────────────────────────────────────────────
```

---

## 🚀 RELEASE CHECKLIST

```
PRE-RELEASE VERIFICATION
├─ [ ] Code review complete
├─ [ ] All tests passing
│  ├─ [ ] Unit tests
│  ├─ [ ] Integration tests
│  └─ [ ] E2E tests
├─ [ ] No security issues
├─ [ ] Performance acceptable
├─ [ ] Documentation complete
└─ [ ] Ready for QA testing

QA TESTING PHASE
├─ [ ] Smoke tests pass (15 min)
├─ [ ] Full regression suite pass (3 hours)
├─ [ ] Performance benchmarks met
├─ [ ] Security tests pass
├─ [ ] Mobile testing complete
├─ [ ] Browser compatibility verified
└─ [ ] All issues documented

APPROVAL PHASE
├─ [ ] QA Lead sign-off
├─ [ ] Product Manager approval
├─ [ ] Tech Lead review
├─ [ ] Security review (if applicable)
└─ [ ] Ready for release
```

---

**END OF VISUAL DIAGRAMS**

This document provides visual representations of:

- ✅ System architecture
- ✅ User workflows
- ✅ Feature dependencies
- ✅ Data flows
- ✅ Navigation hierarchy
- ✅ Test scenarios
- ✅ Security flows
- ✅ Performance targets
