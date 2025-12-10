# Golden Path Implementation - TODO Tracker

**Last Updated**: December 9, 2025

## Overview
This document tracks the implementation of the Golden Path for the agency job-finisher workflow, ensuring users can move from raw photos to deliverable outputs seamlessly.

---

## ✅ COMPLETED TASKS

### API 404 Fixes (December 9, 2025)
- [x] **Fixed `/api/brand-kits/masking-models` 404 error**
  - Issue: Route defined after `/:id` route, causing Express to treat "masking-models" as ID
  - Solution: Moved route before `/:id` in `backend/src/routes/brandKits.ts`
  - Verified: Endpoint returns 200/304 with model data
  - Files: `backend/src/routes/brandKits.ts`

- [x] **Fixed `/api/assets?workspaceId=...` 404 error**
  - Issue: Frontend calling with query param but backend only had `/workspace/:workspaceId` route
  - Solution: Added `GET /api/assets/` route accepting query parameter
  - Verified: Endpoint returns 200/304 with assets data
  - Files: `backend/src/routes/assets.ts`

### P0 Golden Path Features (December 9, 2025)
- [x] **Added "Generate Outputs" button in Assets tab**
  - Location: Campaign Detail > Assets tab
  - Features:
    - Clear description: "Upload raw photos and generate on-brand social posts"
    - Disabled when no assets or no brand kit
    - Calls `/api/creative-engine/generate` endpoint
    - Shows loading state during generation
    - Displays error messages on failure
    - Auto-switches to Approvals tab on success
  - UX improvements:
    - Empty state with icon and guidance
    - Success state showing asset count
    - Clear next action indicator
  - Files: `frontend/src/components/agency/CampaignDetail.tsx`

---

## 🔧 TECH DEBT TO RESOLVE

### TypeScript Errors in Test Files (72 total - down from 98)
**Priority**: High  
**Impact**: Blocks clean builds, reduces code quality  
**Progress**: 26 errors fixed (27% reduction)

**Recent Fixes (December 10, 2025)**:
- Fixed implicit any types in contrast.test.ts (2 errors)
- Fixed missing TextStyle import in textRenderer.test.ts (6 errors) 
- Fixed invalid StylePreset value in CaptionWorkflow.integration.test.tsx (2 errors)

#### Category 1: Property Test Type Mismatches (18 errors)
**Files affected**:
- `frontend/src/components/ConfirmDialog.property.test.tsx` (6 errors)
- `frontend/src/components/PromptDialog.property.test.tsx` (8 errors)
- `frontend/src/components/PromptDialog.validation.property.test.tsx` (4 errors)

**Issue**: Property test functions return `Promise<void>` but type expects `boolean | void`

**Solution approach**:
```typescript
// Current (incorrect):
fc.property(fc.string(), async (title: string) => {
  await someAsyncOperation()
})

// Fixed:
fc.property(fc.string(), (title: string) => {
  return someAsyncOperation().then(() => true)
})
```

**Tasks**:
- [x] Fix ConfirmDialog.property.test.tsx async return types (6 errors fixed)
- [x] Fix PromptDialog.property.test.tsx async return types (8 errors fixed)
- [x] Fix PromptDialog.validation.property.test.tsx async return types (4 errors fixed)

**Progress**: 18 errors fixed in Category 1. Reduced total from 98 to 82 errors.

#### Category 2: Canvas Test Type Mismatches (5 errors)
**Files affected**:
- `frontend/src/lib/canvas/finalTesting.integration.test.ts` (5 errors)

**Issue**: HTMLImageElement vs HTMLCanvasElement type confusion

**Solution approach**:
```typescript
// Ensure proper type casting or use correct element type
const canvas = document.createElement('canvas')
const image = document.createElement('img')
// Don't mix these types
```

**Tasks**:
- [ ] Fix canvas/image element type mismatches in finalTesting.integration.test.ts

#### Category 3: Missing Type Definitions (6 errors)
**Files affected**:
- `frontend/src/lib/canvas/textRenderer.test.ts` (6 errors)

**Issue**: `TextStyle` type not found

**Solution approach**:
```typescript
// Add proper import or type definition
import { TextStyle } from './types'
// or define inline if needed
```

**Tasks**:
- [ ] Add TextStyle type import/definition to textRenderer.test.ts

#### Category 4: Integration Test Type Issues (2 errors)
**Files affected**:
- `frontend/src/components/CaptionWorkflow.integration.test.tsx` (2 errors)

**Issue**: Type mismatches in test setup

**Tasks**:
- [ ] Fix null assignment to string type
- [ ] Fix StylePreset type mismatch

#### Category 5: Progressive Disclosure Type Issues (1 error)
**Files affected**:
- `frontend/src/lib/disclosure/ProgressiveDisclosureManager.property.test.ts` (1 error)

**Issue**: FeatureConfig type mismatch in arbitrary generation

**Tasks**:
- [ ] Fix FeatureConfig type definition or arbitrary generator

---

## 📋 REMAINING P0 GOLDEN PATH FEATURES

### 1. Display Generated Outputs in Approvals Tab
**Priority**: P0 - Critical  
**Estimated Time**: 4 hours  
**Status**: Not started

**Requirements**:
- Fetch generated assets from `/api/generated-assets?campaignId=...`
- Display in grid layout with thumbnails
- Show caption text
- Add approve/reject buttons per output
- Show generation status (pending/approved/rejected)

**Files to modify**:
- `frontend/src/components/agency/ApprovalGrid.tsx`

**Tasks**:
- [ ] Add API call to fetch generated assets
- [ ] Create output card component with thumbnail + caption
- [ ] Add approve/reject action handlers
- [ ] Add status indicators
- [ ] Add empty state for no outputs yet
- [ ] Test end-to-end generation → display flow

### 2. Campaign Readiness Checklist
**Priority**: P0 - Critical  
**Estimated Time**: 2 hours  
**Status**: Not started

**Requirements**:
- Show checklist in campaign header or sidebar
- Items: Brand kit configured, Assets uploaded, Outputs generated
- Visual indicators (checkmarks, progress)
- Click to navigate to incomplete sections

**Files to modify**:
- `frontend/src/components/agency/CampaignDetail.tsx`

**Tasks**:
- [ ] Create ReadinessChecklist component
- [ ] Add logic to check completion status
- [ ] Add navigation on click
- [ ] Style with clear visual hierarchy
- [ ] Test with various completion states

### 3. Fix Invalid Date Display
**Priority**: P0 - Trust killer  
**Estimated Time**: 30 minutes  
**Status**: Not started

**Issue**: Campaign cards show "Invalid Date"

**Files to check**:
- `frontend/src/components/agency/CampaignList.tsx`
- `frontend/src/components/agency/CampaignDetail.tsx`

**Tasks**:
- [ ] Identify date field causing issue
- [ ] Add proper date parsing/formatting
- [ ] Handle null/undefined dates gracefully
- [ ] Test with various date formats

### 4. Export Button with Package Preview
**Priority**: P0 - Critical  
**Estimated Time**: 2 hours  
**Status**: Not started

**Requirements**:
- Export button in Approvals tab
- Shows what will be included in package
- Downloads ZIP with approved outputs + metadata
- Clear naming convention

**Files to modify**:
- `frontend/src/components/agency/ApprovalGrid.tsx`
- Backend export endpoint (check if exists)

**Tasks**:
- [ ] Add Export button to Approvals tab
- [ ] Create preview modal showing package contents
- [ ] Implement ZIP generation (backend)
- [ ] Add download trigger
- [ ] Test with multiple approved outputs

---

## 📋 P1 PROFESSIONAL FEEL FEATURES

### 5. Campaign Status State Machine
**Priority**: P1  
**Estimated Time**: 3 hours  
**Status**: Not started

**Requirements**:
- States: Draft → Ready → Generating → Review → Approved → Delivered
- Automatic transitions based on actions
- Visual status indicator
- Status-based UI changes

**Tasks**:
- [ ] Define state machine logic
- [ ] Add status field to campaign model
- [ ] Update status on key actions
- [ ] Add status badge component
- [ ] Test state transitions

### 6. Better Empty States
**Priority**: P1  
**Estimated Time**: 2 hours  
**Status**: Partially complete (Assets tab done)

**Requirements**:
- Clear guidance for each empty state
- Visual hierarchy with icons (no emojis)
- Next action prominently displayed

**Tasks**:
- [x] Assets tab empty state (completed)
- [ ] Approvals tab empty state
- [ ] Campaign Brief empty state
- [ ] Brand Kit empty state

### 7. Minimum Editing Controls
**Priority**: P1  
**Estimated Time**: 1 day  
**Status**: Not started

**Requirements**:
- Edit caption text inline
- Basic text positioning controls
- Save edited version

**Tasks**:
- [ ] Add edit mode to output cards
- [ ] Implement caption editing
- [ ] Add text position controls
- [ ] Save edited outputs
- [ ] Test editing workflow

### 8. Settings Page Basic
**Priority**: P1  
**Estimated Time**: 1 day  
**Status**: Not started

**Requirements**:
- Agency profile section
- Workspace defaults
- Usage counters
- Basic preferences

**Tasks**:
- [ ] Create Settings page route
- [ ] Add agency profile form
- [ ] Add workspace defaults section
- [ ] Add usage display
- [ ] Wire up save functionality

### 9. Admin/Reset for Testing
**Priority**: P1  
**Estimated Time**: 2 hours  
**Status**: Not started

**Requirements**:
- Dev-only admin panel
- Reset demo data button
- Clear all workspaces/campaigns
- Seed fresh test data

**Tasks**:
- [ ] Create admin route (dev only)
- [ ] Add reset data endpoint
- [ ] Add seed data endpoint
- [ ] Add UI controls
- [ ] Test reset functionality

---

## 🎨 UI/UX IMPROVEMENTS

### Replace Emoji Icons with Proper Icon Set
**Priority**: Medium  
**Estimated Time**: 2-3 hours  
**Status**: ✅ Complete

**Current emoji usage**:
- 📸 (camera) in Assets empty state
- 📁 (folder) in AssetUploader
- 📋 (clipboard) in Campaign Brief
- 📝 (memo) in Campaign Brief empty state

**Recommended icon libraries**:
- Lucide React (lightweight, tree-shakeable)
- Heroicons (Tailwind's icon set)
- Phosphor Icons (comprehensive)

**Tasks**:
- [x] Choose icon library (Lucide React - already installed)
- [x] Install dependency (already available)
- [x] Replace camera emoji with Camera icon
- [x] Replace folder emoji with FolderOpen icon
- [x] Replace clipboard emoji with ClipboardList icon
- [x] Replace memo emoji with FileText icon
- [x] Update all other emoji usage across app (if any remain)
- [x] Ensure consistent sizing and styling (48px, strokeWidth 1.5)

### Replace Browser Modals with Custom Components
**Priority**: High  
**Estimated Time**: 3-4 hours  
**Status**: ✅ Complete (Priority files)

**Issue**: Using browser `alert()`, `confirm()`, and `prompt()` creates inconsistent UX and looks unprofessional

**Custom components available**:
- `Toast` - for success/error/info notifications
- `ConfirmDialog` - for confirmations
- `PromptDialog` - for text input prompts
- `Modal` - for general modals

**Tasks**:
- [x] Replace `alert('Campaign data saved!')` with Toast in CampaignDetail.tsx
- [x] Replace `alert('Failed to save data')` with Toast in CampaignDetail.tsx
- [x] Replace `alert('Successfully generated...')` with Toast in CampaignDetail.tsx
- [x] Replace `alert('No approved captions')` with Toast in ApprovalGrid.tsx
- [x] Replace `window.confirm('Reset this workspace?')` with ConfirmDialog in WorkspaceList.tsx
- [x] Replace `window.prompt('Add an optional reason?')` with PromptDialog in ReviewGrid.tsx (2 instances)
- [ ] Replace browser modals in settings components (AuditLogs, SecuritySettings, BrandKitSettings, etc.)

**Files completed**:
- ✅ `frontend/src/components/agency/CampaignDetail.tsx` (3 alerts → Toast)
- ✅ `frontend/src/components/agency/ApprovalGrid.tsx` (1 alert → Toast)
- ✅ `frontend/src/components/agency/WorkspaceList.tsx` (1 confirm → ConfirmDialog)
- ✅ `frontend/src/components/agency/ReviewGrid.tsx` (2 prompts → PromptDialog)

**Files remaining** (lower priority):
- `frontend/src/components/agency/settings/AuditLogs.tsx` (1 alert)
- `frontend/src/components/agency/settings/SecuritySettings.tsx` (2 alerts)
- `frontend/src/components/agency/settings/BrandKitSettings.tsx` (6 alerts, 2 confirms)
- `frontend/src/components/agency/settings/BillingSubscription.tsx` (4 alerts, 2 confirms)
- `frontend/src/components/agency/settings/UserManagement.tsx` (8 alerts, 2 confirms)
- `frontend/src/components/agency/settings/OrganizationSettings.tsx` (2 alerts)
- `frontend/src/components/agency/settings/IntegrationsSettings.tsx` (6 alerts, 2 confirms)

---

## 🔍 VERIFICATION CHECKLIST

Before marking any task complete:

- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Zero TypeScript errors in source code
- [ ] Zero console errors in browser
- [ ] Feature works end-to-end
- [ ] Network requests succeed
- [ ] User can complete the workflow
- [ ] No broken UI states
- [ ] Proper error handling
- [ ] Loading states implemented

---

## 📊 PROGRESS SUMMARY

**Completed**: 6 tasks + 18 TypeScript errors fixed + Emoji replacement + Browser modal replacement  
**In Progress**: Tech debt resolution (Category 1 complete)  
**Remaining**: 20 feature tasks  
**Tech Debt Items**: 82 TypeScript errors remaining (down from 98)

**Latest Updates** (December 9, 2025):
- ✅ Replaced all emojis with Lucide React icons (Camera, FolderOpen, FileText, ClipboardList)
- ✅ Replaced browser modals with custom Toast/ConfirmDialog/PromptDialog in priority files
- Consistent styling: 48px size, 1.5 strokeWidth, proper color theming
- Zero TypeScript errors in modified files

**Estimated Time to MVP**: 2-3 days (P0 features only)  
**Estimated Time to Professional**: 5-6 days (P0 + P1 features)

---

## 🎯 NEXT IMMEDIATE ACTIONS

1. **Display generated outputs in Approvals tab** (critical for workflow)
2. **Add campaign readiness checklist** (improves UX clarity)
3. **Fix invalid date display** (trust killer)
4. **Check responsiveness for different screen sizes** (mobile/tablet support)
5. **Fix remaining TypeScript errors** (continue with Category 2 - canvas tests)

---

## 📝 NOTES

- All API 404 errors have been resolved
- Generate button successfully integrated
- Backend and frontend both running without errors
- Production build succeeds
- Test file TypeScript errors do not block production builds (excluded in tsconfig.build.json)
- However, test errors should still be fixed to maintain code quality and enable proper testing
