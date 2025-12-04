# Complete Testing Guide - Part 1: Pages, Routes & Navigation

**Document Version:** 1.0  
**Created:** December 4, 2025  
**Status:** Active Testing Guide  
**Audience:** QA Engineers, Testers, Product Managers

---

## 📑 TABLE OF CONTENTS

1. [Page/Route Inventory](#page-route-inventory)
2. [Route Architecture](#route-architecture)
3. [Navigation Flows](#navigation-flows)
4. [Authentication Flow](#authentication-flow)
5. [Page-Specific Checklists](#page-specific-checklists)

---

## 📱 PAGE/ROUTE INVENTORY

### Summary Table

| Page            | Route                                          | Auth Required | Purpose                  | Status         |
| --------------- | ---------------------------------------------- | ------------- | ------------------------ | -------------- |
| Login           | `/login`                                       | ❌ No         | User authentication      | ✅ Implemented |
| Playground      | `/playground`                                  | ❌ No         | Demo/legacy caption tool | ✅ Implemented |
| Workspaces      | `/agency/workspaces`                           | ✅ Yes        | Workspace management hub | ✅ Implemented |
| Campaigns       | `/agency/workspaces/:id/campaigns`             | ✅ Yes        | Campaign list & creation | ✅ Implemented |
| Campaign Detail | `/agency/workspaces/:id/campaigns/:cid`        | ✅ Yes        | Campaign management      | ✅ Implemented |
| Review Grid     | `/agency/workspaces/:id/campaigns/:cid/review` | ✅ Yes        | Asset approval workflow  | ✅ Implemented |

---

## 🏗️ ROUTE ARCHITECTURE

### Frontend Route Structure

```
App.tsx
├── Public Routes
│   ├── /login → Login Component
│   └── /playground → Playground Component (legacy)
│
├── Protected Routes (requires auth)
│   └── /agency/* → AgencyRoutes wrapper
│       ├── /workspaces → WorkspaceList
│       ├── /workspaces/:workspaceId/campaigns → CampaignList
│       ├── /workspaces/:workspaceId/campaigns/:campaignId → CampaignDetail
│       └── /workspaces/:workspaceId/campaigns/:campaignId/review → ReviewGrid
│
└── Default Behavior
    └── / → Redirects based on auth state
        ├── If authenticated → /agency/workspaces
        └── If not authenticated → /playground
```

### Backend API Endpoints (Protected)

```
Base URL: http://localhost:3001/api

PUBLIC:
├── POST /auth/signup
├── POST /auth/login
└── GET /auth/me

PROTECTED (require auth):
├── POST /auth/logout
│
├── GET /workspaces
├── POST /workspaces
├── GET /workspaces/:id
├── PUT /workspaces/:id
├── DELETE /workspaces/:id
│
├── GET /brandKits
├── POST /brandKits
├── GET /brandKits/:id
├── PUT /brandKits/:id
├── DELETE /brandKits/:id
│
├── GET /campaigns
├── POST /campaigns
├── GET /campaigns/:id
├── PUT /campaigns/:id
├── PATCH /campaigns/:id/launch
├── PATCH /campaigns/:id/pause
│
├── POST /assets/upload
├── GET /assets/workspace/:workspaceId
├── GET /assets/:id
├── DELETE /assets/:id
│
├── POST /caption
├── POST /caption/batch
├── GET /caption/batch/:jobId
├── GET /caption/templates
│
├── POST /mask
├── POST /adCreatives
├── GET /adCreatives/:id
│
├── POST /batch
└── GET /batch/:jobId
```

---

## 🗺️ NAVIGATION FLOWS

### 1. **Initial Load Navigation**

```
┌─────────────────────────────────────────────┐
│ User Visits http://localhost:3001           │
│ or http://localhost:5173 (frontend dev)     │
└──────────────┬──────────────────────────────┘
               │
               ▼
        ┌──────────────────┐
        │ Check Auth State │
        │ GET /api/auth/me │
        └────────┬─────────┘
                 │
        ┌────────┴─────────┐
        │                  │
   ✅ Authenticated    ❌ Not Authenticated
        │                  │
        ▼                  ▼
    /agency/         /playground
    workspaces       (public demo)
```

### 2. **Authentication Flow**

```
START
  │
  ▼
┌─────────────────────────────────────┐
│ Visit /login                        │
│ Show: Email/Password Form           │
│ CTA: Sign Up / Login               │
└──────────────┬──────────────────────┘
               │
        ┌──────┴──────┐
        │             │
        ▼             ▼
    [Sign Up]    [Login]
        │             │
        ▼             ▼
   POST /signup   POST /login
   (new user)     (existing user)
        │             │
        └──────┬──────┘
               │
               ▼
        ┌──────────────────┐
        │ Set Session      │
        │ HTTP-only Cookie │
        │ (auth verified)  │
        └────────┬─────────┘
                 │
                 ▼
        Redirect to
        /agency/workspaces
```

### 3. **Workspace Selection Flow**

```
/agency/workspaces (WorkspaceList)
         │
         ├─ Display all workspaces
         ├─ [Create New Workspace] button
         └─ Click workspace
              │
              ▼
/agency/workspaces/:id/campaigns
(CampaignList)
              │
              ├─ Show all campaigns for workspace
              ├─ [Create New Campaign] button
              └─ Click campaign
                   │
                   ▼
/agency/workspaces/:id/campaigns/:cid
(CampaignDetail)
                   │
                   ├─ Edit campaign details
                   ├─ Upload assets
                   ├─ Generate captions
                   └─ [Go to Review] button
                        │
                        ▼
/agency/workspaces/:id/campaigns/:cid/review
(ReviewGrid)
                        │
                        ├─ Approve/Reject items
                        ├─ Edit captions
                        └─ [Export] button
```

### 4. **Campaign Workflow Navigation**

```
┌──────────────────────────────────┐
│ 1. Campaign Detail Page          │
│                                  │
│ ✎ Edit campaign info             │
│ 📝 Add campaign brief            │
│ 🎯 Set objectives                │
│ 👥 Define target audience        │
│ 📤 Add reference creatives       │
└────────────┬─────────────────────┘
             │
             ▼
┌──────────────────────────────────┐
│ 2. Asset Upload (AssetManager)   │
│                                  │
│ 📸 Upload 1-20 images/videos     │
│ ✅ Validate format/size          │
│ 📋 Show upload progress          │
│ ✓ Confirm upload complete       │
└────────────┬─────────────────────┘
             │
             ▼
┌──────────────────────────────────┐
│ 3. Generate Captions             │
│                                  │
│ ⚙️ Configure generation params    │
│ 🔄 Generate variations (3 per)   │
│ ⏳ Track batch job progress       │
│ 📊 Show scoring results          │
└────────────┬─────────────────────┘
             │
             ▼
┌──────────────────────────────────┐
│ 4. Review & Approve (ReviewGrid) │
│                                  │
│ 🖼️ Grid view of all assets       │
│ ⭐ Show scored captions          │
│ ✓ Approve best options           │
│ ✏️ Edit captions inline          │
│ 🚀 Launch approved items         │
└────────────┬─────────────────────┘
             │
             ▼
┌──────────────────────────────────┐
│ 5. Export Results                │
│                                  │
│ 📦 Package as ZIP                │
│ 📄 Include ad copy + captions    │
│ 📥 Download to client            │
└──────────────────────────────────┘
```

---

## 🔐 AUTHENTICATION FLOW

### Login Page Test Checklist

**Route:** `/login`  
**Components:** Login.tsx

#### Test Cases

| #          | Scenario            | Steps                                                         | Expected Result                   | Status  |
| ---------- | ------------------- | ------------------------------------------------------------- | --------------------------------- | ------- |
| **AUTH-1** | Valid credentials   | 1. Enter email & password<br>2. Click Login                   | ✅ Redirect to /agency/workspaces | 🔴 Test |
| **AUTH-2** | Invalid email       | 1. Enter fake@email.com<br>2. Click Login                     | ❌ Show error message             | 🔴 Test |
| **AUTH-3** | Wrong password      | 1. Enter correct email<br>2. Wrong password<br>3. Click Login | ❌ Show error message             | 🔴 Test |
| **AUTH-4** | Empty fields        | 1. Leave fields blank<br>2. Click Login                       | ❌ Show validation error          | 🔴 Test |
| **AUTH-5** | New signup          | 1. Click "Sign Up" link<br>2. Fill form<br>3. Submit          | ✅ Create account & redirect      | 🔴 Test |
| **AUTH-6** | Session persistence | 1. Login<br>2. Refresh page<br>3. Check if logged in          | ✅ Stay logged in (cookie)        | 🔴 Test |
| **AUTH-7** | Logout              | 1. Click logout in header<br>2. Check navigation              | ✅ Redirect to /login             | 🔴 Test |
| **AUTH-8** | Expired session     | 1. Let session expire<br>2. Try to access /agency/\*          | ⚠️ Redirect to /login             | 🔴 Test |

#### UI Elements to Verify

- [ ] Email input field (type=email)
- [ ] Password input field (type=password)
- [ ] Login button (CTA)
- [ ] Sign Up link
- [ ] Error message display
- [ ] Loading state during login
- [ ] Password visibility toggle (if implemented)
- [ ] Form validation messages

---

## 📄 PAGE-SPECIFIC CHECKLISTS

### Page 1: Workspaces List

**Route:** `/agency/workspaces`  
**Component:** WorkspaceList.tsx

#### Navigation

- [ ] Page loads when authenticated
- [ ] Sidebar shows "Workspaces" active
- [ ] Back button works (if applicable)
- [ ] Header shows user/logout

#### Content Display

- [ ] All user's workspaces displayed in grid/list
- [ ] Each workspace card shows:
  - [ ] Workspace name
  - [ ] Number of campaigns
  - [ ] Created date
  - [ ] Action buttons (edit, delete)

#### Interactions

- [ ] Click workspace → navigate to campaigns page
- [ ] Create workspace modal opens
- [ ] Fill form with workspace name
- [ ] Submit creates new workspace
- [ ] Workspace appears in list
- [ ] Edit workspace updates name
- [ ] Delete workspace removes from list (with confirmation)

#### Edge Cases

- [ ] Empty state (no workspaces) → Show CTA to create
- [ ] Large list (50+) → Pagination/scroll works
- [ ] Search/filter (if implemented)
- [ ] Sort by date/name (if implemented)

---

### Page 2: Campaigns List

**Route:** `/agency/workspaces/:workspaceId/campaigns`  
**Component:** CampaignList.tsx

#### Navigation

- [ ] Breadcrumb: Workspaces > [WorkspaceName] > Campaigns
- [ ] Back button → Go to workspaces
- [ ] Click campaign → Go to campaign detail page

#### Content Display

- [ ] All campaigns for workspace shown
- [ ] Each campaign card displays:
  - [ ] Campaign name
  - [ ] Status (draft, active, paused, completed)
  - [ ] Number of assets
  - [ ] Last modified date
  - [ ] Status indicator (color coded)

#### Interactions

- [ ] Create Campaign button opens modal
- [ ] Form fields: name, objective, target audience
- [ ] Submit creates campaign (GET all campaigns updates)
- [ ] Edit campaign (if in detail view)
- [ ] Delete campaign (with confirmation)
- [ ] Launch/pause campaign

#### Filters & Sorting

- [ ] Filter by status
- [ ] Sort by date, name
- [ ] Search campaigns by name

---

### Page 3: Campaign Detail

**Route:** `/agency/workspaces/:workspaceId/campaigns/:campaignId`  
**Component:** CampaignDetail.tsx

#### Tabs/Sections

- [ ] Campaign Info tab
- [ ] Assets tab
- [ ] Generation Settings tab
- [ ] Results tab

#### Campaign Info Section

- [ ] Display campaign name & description
- [ ] Edit form: name, objective, target audience
- [ ] Brand kit selector dropdown
- [ ] Campaign brief text area
- [ ] Reference creative upload area

#### Assets Section (AssetManager)

- [ ] Show all uploaded assets
- [ ] Upload zone (drag-drop)
- [ ] File validation (image/video types)
- [ ] File size validation (50MB limit)
- [ ] Max file count (20) validation
- [ ] Upload progress bar
- [ ] Remove asset button
- [ ] Asset preview thumbnail

#### Generation Settings

- [ ] Select caption style/tone
- [ ] Set number of variations (default: 3)
- [ ] Platform targeting (Instagram, TikTok, etc.)
- [ ] Brand voice parameters
- [ ] Generate button

#### Results Section

- [ ] Show generated captions
- [ ] Display scoring (clarity, originality, brand consistency)
- [ ] Show caption variations per asset
- [ ] [Go to Review] button to approve

---

### Page 4: Review Grid

**Route:** `/agency/workspaces/:workspaceId/campaigns/:campaignId/review`  
**Component:** ReviewGrid.tsx

#### Grid Layout

- [ ] Assets displayed in grid (2-3 columns)
- [ ] Each asset shows thumbnail + captions
- [ ] Scrollable if many assets
- [ ] Responsive on mobile (1 column)

#### Asset Card Elements

- [ ] Asset image/video thumbnail
- [ ] Multiple caption cards (scored)
- [ ] Star rating/score display
- [ ] Approve/reject buttons per caption
- [ ] Edit button (inline editing)
- [ ] Badge showing best option

#### Interactions

- [ ] Click approve → Mark caption as approved
- [ ] Click reject → Mark as rejected
- [ ] Click edit → Show text editor
- [ ] Edit caption text
- [ ] Save edit → Update caption
- [ ] Select multiple items (checkboxes)
- [ ] Batch approve selected
- [ ] Batch reject selected

#### Export Section

- [ ] Export button at bottom
- [ ] Select export format (ZIP)
- [ ] Include options:
  - [ ] Images + captions
  - [ ] Ad copy (headline, body, CTA)
  - [ ] Scoring data
- [ ] Download progress indicator
- [ ] Success message after download

---

## 🎮 PLAYGROUND PAGE

**Route:** `/playground`  
**Component:** Playground.tsx

### Purpose

Legacy/demo caption generation tool (no auth required)

### Features

- [ ] Upload image (single)
- [ ] Select caption style (6 options: creative, funny, poetic, minimal, dramatic, quirky)
- [ ] Generate caption button
- [ ] View generated caption(s)
- [ ] Copy to clipboard
- [ ] Download as image
- [ ] Share on social media
- [ ] Recent gallery view
- [ ] Theme toggle (dark/light)
- [ ] Keyboard shortcuts (Konami code for easter egg)

### Test Cases

| #          | Feature          | Steps               | Expected                        |
| ---------- | ---------------- | ------------------- | ------------------------------- |
| **PLAY-1** | Upload image     | Drag/drop or click  | Image preview shown             |
| **PLAY-2** | Style selection  | Select style        | Caption generation changes tone |
| **PLAY-3** | Generate caption | Click button        | Caption generated in 2-3s       |
| **PLAY-4** | Copy caption     | Click copy          | Toast notification "Copied!"    |
| **PLAY-5** | Download         | Click save          | Image file downloaded           |
| **PLAY-6** | Gallery          | Generate 3 captions | All shown in gallery            |
| **PLAY-7** | Theme toggle     | Click moon icon     | Light/dark mode switch          |
| **PLAY-8** | Responsive       | Resize to mobile    | Layout adapts correctly         |

---

## ✅ NAVIGATION VERIFICATION CHECKLIST

### Cross-Page Navigation

- [ ] Workspaces → Campaigns → Campaign Detail → Review works forward & backward
- [ ] Breadcrumbs are accurate and clickable
- [ ] Browser back button works correctly
- [ ] Header logout works from any page
- [ ] Protected routes redirect to login when not authenticated
- [ ] Public routes (playground, login) accessible without auth

### Route Parameters

- [ ] `/agency/workspaces/:id` - valid workspace ID required
- [ ] `/agency/workspaces/:id/campaigns/:cid` - both IDs required
- [ ] Invalid IDs show 404 or error page
- [ ] Route params persist on page refresh

### Loading States

- [ ] Each page shows loader while data fetches
- [ ] Loader disappears when data loads
- [ ] Error state shown if API fails
- [ ] Retry button appears on error

---

## 🐛 KNOWN ISSUES TO TEST

### Navigation Issues

- [ ] Back navigation from ReviewGrid might not work correctly (ISSUE)
- [ ] Deep linking to campaign detail (direct URL) needs verification
- [ ] Workspace switch while editing campaign (unsaved changes)

### Route Issues

- [ ] 404 page not implemented - need to add
- [ ] 500 error page not implemented - need to add
- [ ] Catch-all route redirects to workspaces (may confuse users)

---

**Next:** See **Part 2** for detailed Feature Workflows & User Flows  
**Next:** See **Part 3** for Use Cases & Testing Scenarios
