# Complete Testing Guide - Part 4: Testing Matrix & Quick Reference

**Document Version:** 1.0  
**Created:** December 4, 2025  
**Status:** Active Testing Guide  
**Audience:** QA Team, Automation Engineers, Release Managers

---

## 📑 TABLE OF CONTENTS

1. [Feature Testing Matrix](#feature-testing-matrix)
2. [Test Execution Checklist](#test-execution-checklist)
3. [Known Issues & Workarounds](#known-issues--workarounds)
4. [Debug Commands](#debug-commands)
5. [Quick Test Paths](#quick-test-paths)

---

## 🎯 FEATURE TESTING MATRIX

### Complete Coverage Map

```
AUTHENTICATION
├─ Login (email/password)
│  ├─ Valid credentials ................. [ ] PASS / [ ] FAIL
│  ├─ Invalid credentials .............. [ ] PASS / [ ] FAIL
│  ├─ Empty fields ..................... [ ] PASS / [ ] FAIL
│  └─ Session persistence ............. [ ] PASS / [ ] FAIL
├─ Signup (new account)
│  ├─ Valid signup form ............... [ ] PASS / [ ] FAIL
│  ├─ Email already exists ............ [ ] PASS / [ ] FAIL
│  ├─ Weak password ................... [ ] PASS / [ ] FAIL
│  └─ Privacy consent required ........ [ ] PASS / [ ] FAIL
├─ Logout
│  ├─ Clear session ................... [ ] PASS / [ ] FAIL
│  ├─ Clear cookie .................... [ ] PASS / [ ] FAIL
│  ├─ Redirect to login ............... [ ] PASS / [ ] FAIL
│  └─ Can't access /agency/* after ... [ ] PASS / [ ] FAIL
└─ Session Management
   ├─ Expiry after 30 minutes ......... [ ] PASS / [ ] FAIL
   ├─ Activity extends session ........ [ ] PASS / [ ] FAIL
   └─ Graceful expiry handling ........ [ ] PASS / [ ] FAIL

WORKSPACE MANAGEMENT
├─ Create Workspace
│  ├─ Form validation ................. [ ] PASS / [ ] FAIL
│  ├─ Duplicate name handling ......... [ ] PASS / [ ] FAIL
│  ├─ Default brand kit created ....... [ ] PASS / [ ] FAIL
│  └─ User set as owner ............... [ ] PASS / [ ] FAIL
├─ View Workspaces
│  ├─ List all workspaces ............ [ ] PASS / [ ] FAIL
│  ├─ Pagination works ............... [ ] PASS / [ ] FAIL
│  ├─ Search by name ................. [ ] PASS / [ ] FAIL
│  └─ Sort by date ................... [ ] PASS / [ ] FAIL
├─ Edit Workspace
│  ├─ Update name .................... [ ] PASS / [ ] FAIL
│  ├─ Update description ............. [ ] PASS / [ ] FAIL
│  └─ Changes persist ................ [ ] PASS / [ ] FAIL
├─ Delete Workspace
│  ├─ Confirmation dialog shown ....... [ ] PASS / [ ] FAIL
│  ├─ Associated campaigns deleted ... [ ] PASS / [ ] FAIL
│  └─ Workspace removed from list .... [ ] PASS / [ ] FAIL
└─ Workspace Access
   ├─ Only see own workspaces ........ [ ] PASS / [ ] FAIL
   ├─ Other agencies can't access ... [ ] PASS / [ ] FAIL
   └─ User can't access after removed [ ] PASS / [ ] FAIL

BRAND KIT MANAGEMENT
├─ Create Brand Kit
│  ├─ Form fields present ............. [ ] PASS / [ ] FAIL
│  ├─ Color picker works ............. [ ] PASS / [ ] FAIL
│  ├─ Font selection works ........... [ ] PASS / [ ] FAIL
│  ├─ Logo upload works .............. [ ] PASS / [ ] FAIL
│  ├─ Voice settings saved ........... [ ] PASS / [ ] FAIL
│  └─ Brand kit ID created ........... [ ] PASS / [ ] FAIL
├─ Apply Brand Kit
│  ├─ Selectable in campaign form .... [ ] PASS / [ ] FAIL
│  ├─ Applied to captions ............ [ ] PASS / [ ] FAIL
│  └─ Voice parameters used .......... [ ] PASS / [ ] FAIL
├─ Edit Brand Kit
│  ├─ All fields editable ............ [ ] PASS / [ ] FAIL
│  ├─ Changes take effect ............ [ ] PASS / [ ] FAIL
│  └─ Existing campaigns unaffected .. [ ] PASS / [ ] FAIL
├─ Delete Brand Kit
│  ├─ Can't delete if in use ......... [ ] PASS / [ ] FAIL
│  ├─ Confirmation required .......... [ ] PASS / [ ] FAIL
│  └─ Deleted from dropdown .......... [ ] PASS / [ ] FAIL
└─ Brand Kit UI
   ├─ Preview of colors shown ........ [ ] PASS / [ ] FAIL
   ├─ Typography preview shown ....... [ ] PASS / [ ] FAIL
   └─ Logo preview shown ............. [ ] PASS / [ ] FAIL

CAMPAIGN MANAGEMENT
├─ Create Campaign
│  ├─ Form validation ................ [ ] PASS / [ ] FAIL
│  ├─ Required fields enforced ....... [ ] PASS / [ ] FAIL
│  ├─ Campaign ID generated .......... [ ] PASS / [ ] FAIL
│  └─ Appears in campaign list ....... [ ] PASS / [ ] FAIL
├─ View Campaign Details
│  ├─ All campaign info displayed .... [ ] PASS / [ ] FAIL
│  ├─ Tabs/sections accessible ....... [ ] PASS / [ ] FAIL
│  ├─ Assets tab shows uploads ....... [ ] PASS / [ ] FAIL
│  └─ Edit button available .......... [ ] PASS / [ ] FAIL
├─ Edit Campaign
│  ├─ Update name .................... [ ] PASS / [ ] FAIL
│  ├─ Update objective ............... [ ] PASS / [ ] FAIL
│  ├─ Update audience ................ [ ] PASS / [ ] FAIL
│  ├─ Add/remove reference creative .. [ ] PASS / [ ] FAIL
│  └─ Changes saved .................. [ ] PASS / [ ] FAIL
├─ Campaign Status
│  ├─ Launch campaign ................ [ ] PASS / [ ] FAIL
│  ├─ Pause campaign ................. [ ] PASS / [ ] FAIL
│  ├─ Status reflected in UI ......... [ ] PASS / [ ] FAIL
│  └─ Archive campaign ............... [ ] PASS / [ ] FAIL
├─ Delete Campaign
│  ├─ Confirmation required .......... [ ] PASS / [ ] FAIL
│  ├─ Associated assets deleted ...... [ ] PASS / [ ] FAIL
│  └─ Removed from list .............. [ ] PASS / [ ] FAIL
└─ Campaign Access Control
   ├─ Only workspace members can access [ ] PASS / [ ] FAIL
   ├─ Other agencies blocked ......... [ ] PASS / [ ] FAIL
   └─ Share with teammates ........... [ ] PASS / [ ] FAIL

ASSET MANAGEMENT
├─ Upload Assets
│  ├─ Single file upload ............. [ ] PASS / [ ] FAIL
│  ├─ Multi-file upload .............. [ ] PASS / [ ] FAIL
│  ├─ Drag-drop upload ............... [ ] PASS / [ ] FAIL
│  ├─ Progress bar visible ........... [ ] PASS / [ ] FAIL
│  └─ Thumbnails generated ........... [ ] PASS / [ ] FAIL
├─ File Validation
│  ├─ Accept jpg/png/mp4/webm ........ [ ] PASS / [ ] FAIL
│  ├─ Reject .exe/.zip/etc ........... [ ] PASS / [ ] FAIL
│  ├─ Check file size (<50MB) ........ [ ] PASS / [ ] FAIL
│  ├─ Check image dimensions ......... [ ] PASS / [ ] FAIL
│  └─ Error messages clear ........... [ ] PASS / [ ] FAIL
├─ Asset Count Limit
│  ├─ Allow 20 assets per campaign ... [ ] PASS / [ ] FAIL
│  ├─ Block 21st upload .............. [ ] PASS / [ ] FAIL
│  ├─ Show count indicator ........... [ ] PASS / [ ] FAIL
│  └─ Can delete to make room ........ [ ] PASS / [ ] FAIL
├─ Manage Assets
│  ├─ Preview thumbnail .............. [ ] PASS / [ ] FAIL
│  ├─ View file metadata ............. [ ] PASS / [ ] FAIL
│  ├─ Delete asset ................... [ ] PASS / [ ] FAIL
│  ├─ Re-upload new version .......... [ ] PASS / [ ] FAIL
│  └─ Confirm deletion ............... [ ] PASS / [ ] FAIL
└─ Asset Storage
   ├─ Files stored in /uploads/ ...... [ ] PASS / [ ] FAIL
   ├─ Accessible for download ........ [ ] PASS / [ ] FAIL
   └─ Cleaned up on deletion ......... [ ] PASS / [ ] FAIL

CAPTION GENERATION
├─ Generation Setup
│  ├─ Assets required (error if none) [ ] PASS / [ ] FAIL
│  ├─ Style/tone selectable .......... [ ] PASS / [ ] FAIL
│  ├─ Variations configurable (1-5) . [ ] PASS / [ ] FAIL
│  ├─ Platforms selectable ........... [ ] PASS / [ ] FAIL
│  └─ Submit button works ............ [ ] PASS / [ ] FAIL
├─ Generation Process
│  ├─ Job queued successfully ........ [ ] PASS / [ ] FAIL
│  ├─ Job ID returned to frontend ... [ ] PASS / [ ] FAIL
│  ├─ Progress tracking works ........ [ ] PASS / [ ] FAIL
│  ├─ Real-time updates .............. [ ] PASS / [ ] FAIL
│  └─ Completes within 5 minutes .... [ ] PASS / [ ] FAIL
├─ Results Display
│  ├─ Captions shown with thumbnails [ ] PASS / [ ] FAIL
│  ├─ Scoring displayed .............. [ ] PASS / [ ] FAIL
│  ├─ All 4 scoring categories ....... [ ] PASS / [ ] FAIL
│  ├─ Top-scored marked .............. [ ] PASS / [ ] FAIL
│  └─ Can view all variations ........ [ ] PASS / [ ] FAIL
├─ Brand Voice Application
│  ├─ Captions follow brand tone .... [ ] PASS / [ ] FAIL
│  ├─ Includes brand phrases ......... [ ] PASS / [ ] FAIL
│  ├─ Avoids forbidden phrases ....... [ ] PASS / [ ] FAIL
│  └─ Personality reflected .......... [ ] PASS / [ ] FAIL
├─ Multi-Platform Variations
│  ├─ Instagram captions differ ...... [ ] PASS / [ ] FAIL
│  ├─ TikTok captions differ ......... [ ] PASS / [ ] FAIL
│  ├─ LinkedIn captions differ ....... [ ] PASS / [ ] FAIL
│  └─ Length varies by platform ..... [ ] PASS / [ ] FAIL
└─ Error Handling
   ├─ Timeout shows error + retry ... [ ] PASS / [ ] FAIL
   ├─ API error handled gracefully ... [ ] PASS / [ ] FAIL
   ├─ Partial results saved .......... [ ] PASS / [ ] FAIL
   └─ Can restart generation ......... [ ] PASS / [ ] FAIL

MASK GENERATION
├─ Generate Mask
│  ├─ Select asset for masking ....... [ ] PASS / [ ] FAIL
│  ├─ Click generate ................. [ ] PASS / [ ] FAIL
│  ├─ Progress shown ................. [ ] PASS / [ ] FAIL
│  └─ Mask image returned ............ [ ] PASS / [ ] FAIL
├─ Mask Quality
│  ├─ Subject isolated (white) ....... [ ] PASS / [ ] FAIL
│  ├─ Background removed (black) .... [ ] PASS / [ ] FAIL
│  ├─ Edges clean .................... [ ] PASS / [ ] FAIL
│  └─ Fine details preserved ......... [ ] PASS / [ ] FAIL
├─ Preview & Apply
│  ├─ Toggle between original/mask ... [ ] PASS / [ ] FAIL
│  ├─ Preview text overlay ........... [ ] PASS / [ ] FAIL
│  ├─ Can adjust positioning ......... [ ] PASS / [ ] FAIL
│  └─ Can adjust color ............... [ ] PASS / [ ] FAIL
└─ Export with Mask
   ├─ Masked version in export ....... [ ] PASS / [ ] FAIL
   ├─ Original also included ......... [ ] PASS / [ ] FAIL
   └─ Can choose which to use ........ [ ] PASS / [ ] FAIL

REVIEW & APPROVAL
├─ Review Grid Display
│  ├─ All assets shown in grid ....... [ ] PASS / [ ] FAIL
│  ├─ Thumbnails visible ............ [ ] PASS / [ ] FAIL
│  ├─ Captions displayed ............. [ ] PASS / [ ] FAIL
│  ├─ Scoring shown .................. [ ] PASS / [ ] FAIL
│  ├─ Responsive on mobile ........... [ ] PASS / [ ] FAIL
│  └─ Scrollable if many items ...... [ ] PASS / [ ] FAIL
├─ Individual Approval
│  ├─ Approve button works ........... [ ] PASS / [ ] FAIL
│  ├─ Reject button works ............ [ ] PASS / [ ] FAIL
│  ├─ Checkmark shown when approved .. [ ] PASS / [ ] FAIL
│  ├─ Red X shown when rejected ...... [ ] PASS / [ ] FAIL
│  └─ Status persists ................ [ ] PASS / [ ] FAIL
├─ Inline Editing
│  ├─ Edit button opens editor ....... [ ] PASS / [ ] FAIL
│  ├─ Text editable .................. [ ] PASS / [ ] FAIL
│  ├─ Save updates caption ........... [ ] PASS / [ ] FAIL
│  ├─ Cancel reverts changes ......... [ ] PASS / [ ] FAIL
│  └─ Changes persist ................ [ ] PASS / [ ] FAIL
├─ Batch Operations
│  ├─ Checkboxes on each item ........ [ ] PASS / [ ] FAIL
│  ├─ Select all button .............. [ ] PASS / [ ] FAIL
│  ├─ Bulk approve works ............. [ ] PASS / [ ] FAIL
│  ├─ Bulk reject works .............. [ ] PASS / [ ] FAIL
│  └─ Count indicator shown .......... [ ] PASS / [ ] FAIL
└─ Navigation
   ├─ Back to campaign works ......... [ ] PASS / [ ] FAIL
   ├─ Re-generate option available ... [ ] PASS / [ ] FAIL
   └─ Export button visible .......... [ ] PASS / [ ] FAIL

EXPORT
├─ Export Configuration
│  ├─ Export button available ........ [ ] PASS / [ ] FAIL
│  ├─ Modal opens with options ....... [ ] PASS / [ ] FAIL
│  ├─ Format selector (ZIP) .......... [ ] PASS / [ ] FAIL
│  ├─ Checkboxes for content ......... [ ] PASS / [ ] FAIL
│  ├─ Images + Captions option ....... [ ] PASS / [ ] FAIL
│  ├─ Ad Copy option ................. [ ] PASS / [ ] FAIL
│  ├─ Scoring data option ............ [ ] PASS / [ ] FAIL
│  └─ [Download] button .............. [ ] PASS / [ ] FAIL
├─ ZIP Creation
│  ├─ ZIP file created ............... [ ] PASS / [ ] FAIL
│  ├─ Progress bar shown ............. [ ] PASS / [ ] FAIL
│  ├─ Completes within 30 seconds ... [ ] PASS / [ ] FAIL
│  └─ File size shown ................ [ ] PASS / [ ] FAIL
├─ ZIP Structure
│  ├─ /images/ folder created ........ [ ] PASS / [ ] FAIL
│  ├─ Images copied correctly ........ [ ] PASS / [ ] FAIL
│  ├─ /captions/ folder created ..... [ ] PASS / [ ] FAIL
│  ├─ Caption files valid ............ [ ] PASS / [ ] FAIL
│  ├─ /ad-copy/ folder created ...... [ ] PASS / [ ] FAIL
│  ├─ Ad copy JSON valid ............. [ ] PASS / [ ] FAIL
│  ├─ manifest.json created .......... [ ] PASS / [ ] FAIL
│  ├─ scoring.json created ........... [ ] PASS / [ ] FAIL
│  └─ All files included ............. [ ] PASS / [ ] FAIL
├─ Download
│  ├─ Download starts automatically .. [ ] PASS / [ ] FAIL
│  ├─ Filename is descriptive ........ [ ] PASS / [ ] FAIL
│  ├─ File not corrupted ............. [ ] PASS / [ ] FAIL
│  ├─ File size accurate ............. [ ] PASS / [ ] FAIL
│  └─ Can re-download ................ [ ] PASS / [ ] FAIL
└─ Post-Export
   ├─ Success message shown .......... [ ] PASS / [ ] FAIL
   ├─ Export history recorded ........ [ ] PASS / [ ] FAIL
   └─ Campaign marked as exported .... [ ] PASS / [ ] FAIL

PLAYGROUND (LEGACY)
├─ Upload
│  ├─ Single image upload ............ [ ] PASS / [ ] FAIL
│  ├─ Drag-drop works ................ [ ] PASS / [ ] FAIL
│  ├─ Preview shows .................. [ ] PASS / [ ] FAIL
│  └─ Remove image button works ...... [ ] PASS / [ ] FAIL
├─ Style Selection
│  ├─ 6 styles available ............. [ ] PASS / [ ] FAIL
│  ├─ Creative (default) ............. [ ] PASS / [ ] FAIL
│  ├─ Funny style .................... [ ] PASS / [ ] FAIL
│  ├─ Poetic style ................... [ ] PASS / [ ] FAIL
│  ├─ Minimal style .................. [ ] PASS / [ ] FAIL
│  ├─ Dramatic style ................. [ ] PASS / [ ] FAIL
│  └─ Quirky style ................... [ ] PASS / [ ] FAIL
├─ Generation
│  ├─ Generate button active ......... [ ] PASS / [ ] FAIL
│  ├─ Loading bar shown .............. [ ] PASS / [ ] FAIL
│  ├─ Caption generated .............. [ ] PASS / [ ] FAIL
│  └─ Takes 2-3 seconds .............. [ ] PASS / [ ] FAIL
├─ Actions
│  ├─ Copy to clipboard .............. [ ] PASS / [ ] FAIL
│  ├─ Toast notification shown ....... [ ] PASS / [ ] FAIL
│  ├─ Download as image .............. [ ] PASS / [ ] FAIL
│  ├─ Share on social media .......... [ ] PASS / [ ] FAIL
│  ├─ Regenerate caption ............. [ ] PASS / [ ] FAIL
│  └─ Clear for new upload ........... [ ] PASS / [ ] FAIL
├─ Gallery
│  ├─ Recent creations shown ......... [ ] PASS / [ ] FAIL
│  ├─ Persists in local storage ...... [ ] PASS / [ ] FAIL
│  ├─ Can click gallery item ......... [ ] PASS / [ ] FAIL
│  ├─ Clear all button works ......... [ ] PASS / [ ] FAIL
│  └─ Confirmation on clear .......... [ ] PASS / [ ] FAIL
├─ Theme
│  ├─ Theme toggle visible ........... [ ] PASS / [ ] FAIL
│  ├─ Light mode works ............... [ ] PASS / [ ] FAIL
│  ├─ Dark mode works ................ [ ] PASS / [ ] FAIL
│  ├─ Toggle animates ................ [ ] PASS / [ ] FAIL
│  └─ Preference persists ............ [ ] PASS / [ ] FAIL
├─ Keyboard
│  ├─ Konami code triggers easter egg [ ] PASS / [ ] FAIL
│  ├─ Party mode activates ........... [ ] PASS / [ ] FAIL
│  └─ Colors cycle ................... [ ] PASS / [ ] FAIL
└─ Responsive
   ├─ Mobile layout (390px) .......... [ ] PASS / [ ] FAIL
   ├─ Tablet layout (768px) .......... [ ] PASS / [ ] FAIL
   ├─ Desktop layout (1200px) ........ [ ] PASS / [ ] FAIL
   └─ Touch targets adequate ......... [ ] PASS / [ ] FAIL
```

---

## ✅ TEST EXECUTION CHECKLIST

### Pre-Test Setup

- [ ] Backend running on http://localhost:3001
- [ ] Frontend running on http://localhost:5173
- [ ] Database initialized (app.sqlite exists)
- [ ] All environment variables set (.env file)
- [ ] Test user account created (test@example.com / password123)
- [ ] Browser dev tools open (F12)
- [ ] Network tab in dev tools active
- [ ] No browser cache (clear or use incognito)

### Testing Workflow

#### Phase 1: Authentication (10 min)

```
1. [ ] Clear browser cache and cookies
2. [ ] Navigate to http://localhost:5173
3. [ ] Should redirect to /login
4. [ ] Test login with valid credentials
5. [ ] Verify redirect to /agency/workspaces
6. [ ] Check session cookie in dev tools
7. [ ] Test logout
8. [ ] Verify redirect to /login
9. [ ] Test session expiry (if time permits)
10. [ ] Document any issues
```

#### Phase 2: Workspace Operations (15 min)

```
1. [ ] Login successfully
2. [ ] Verify workspaces list loads
3. [ ] Create new workspace (name: "Test WS")
4. [ ] Verify new workspace in list
5. [ ] Click workspace to open
6. [ ] Verify campaign list is empty
7. [ ] Edit workspace name
8. [ ] Verify changes saved
9. [ ] Navigate back to workspaces
10. [ ] Document any issues
```

#### Phase 3: Brand Kit Setup (10 min)

```
1. [ ] Click workspace
2. [ ] Navigate to Brand Kit section
3. [ ] Create new brand kit:
    - [ ] Name: "Test Brand"
    - [ ] Colors: Red, Blue, Green
    - [ ] Fonts: Arial, Helvetica
    - [ ] Logo: Upload image (optional)
    - [ ] Personality: Fun, Creative
4. [ ] Save brand kit
5. [ ] Verify in brand kit list
6. [ ] Edit brand kit (change 1 color)
7. [ ] Verify changes saved
8. [ ] Document any issues
```

#### Phase 4: Campaign Management (10 min)

```
1. [ ] Navigate to campaigns
2. [ ] Create new campaign:
    - [ ] Name: "Q1 Campaign"
    - [ ] Objective: "Increase awareness"
    - [ ] Target: "Tech-savvy users"
    - [ ] Brand kit: Select test brand
    - [ ] Brief: "Test campaign"
3. [ ] Click create
4. [ ] Verify campaign appears in list
5. [ ] Click campaign to open detail
6. [ ] Verify all fields displayed
7. [ ] Click edit campaign
8. [ ] Update objective
9. [ ] Save changes
10. [ ] Document any issues
```

#### Phase 5: Asset Upload (15 min)

```
1. [ ] In campaign detail, go to Assets
2. [ ] Upload 3 test images:
    - [ ] Image 1 (small, <1MB)
    - [ ] Image 2 (medium, 5MB)
    - [ ] Image 3 (large, 20MB)
3. [ ] Monitor upload progress
4. [ ] Verify all 3 appear in list
5. [ ] Verify thumbnails generated
6. [ ] Test delete asset button
7. [ ] Delete 1 asset
8. [ ] Verify removed from list
9. [ ] Upload replacement
10. [ ] Verify count: 3/20
11. [ ] Document any issues
```

#### Phase 6: Caption Generation (20 min)

```
1. [ ] Go to generation settings
2. [ ] Configure:
    - [ ] Tone: Creative
    - [ ] Variations: 3
    - [ ] Platforms: Instagram
3. [ ] Click Generate
4. [ ] Verify job starts
5. [ ] Monitor progress:
    - [ ] Progress bar updates
    - [ ] Status text changes
    - [ ] Completes within 5 min
6. [ ] View results:
    - [ ] All 9 captions shown (3×3)
    - [ ] Scoring displayed
    - [ ] Thumbnails visible
7. [ ] Check scoring breakdown:
    - [ ] Clarity score
    - [ ] Originality score
    - [ ] Brand consistency score
    - [ ] Platform relevance score
8. [ ] Document any issues
```

#### Phase 7: Review & Approval (15 min)

```
1. [ ] Navigate to Review Grid
2. [ ] Verify all 3 assets in grid
3. [ ] For each asset:
    - [ ] Read captions
    - [ ] Check scoring
    - [ ] Click approve best
    - [ ] Verify checkmark
4. [ ] Test batch approval:
    - [ ] Select all (3 items)
    - [ ] Click bulk approve
    - [ ] All get checkmarks
5. [ ] Test inline editing:
    - [ ] Click edit on caption
    - [ ] Change text
    - [ ] Save
    - [ ] Verify change persists
6. [ ] Document any issues
```

#### Phase 8: Export (15 min)

```
1. [ ] From Review Grid, click Export
2. [ ] Configure export:
    - [ ] Format: ZIP
    - [ ] Include: Images + Captions ✓
    - [ ] Include: Ad Copy ✓
    - [ ] Include: Scoring ✓
3. [ ] Click Download
4. [ ] Monitor download
5. [ ] Wait for completion
6. [ ] Extract ZIP to test folder
7. [ ] Verify structure:
    - [ ] /images/ folder (3 files)
    - [ ] /captions/ folder (3 files)
    - [ ] /ad-copy/ folder (3 files)
    - [ ] manifest.json
    - [ ] scoring.json
8. [ ] Spot check files:
    - [ ] Images valid
    - [ ] Captions readable
    - [ ] JSON valid format
9. [ ] Document any issues
```

#### Phase 9: Playground Testing (10 min)

```
1. [ ] Navigate to /playground
2. [ ] No login required - verify
3. [ ] Upload image:
    - [ ] Drag or click
    - [ ] Preview shown
4. [ ] Select style: Funny
5. [ ] Click Generate
6. [ ] Wait for caption
7. [ ] Copy to clipboard
8. [ ] Verify toast notification
9. [ ] Download caption as image
10. [ ] Document any issues
```

#### Phase 10: Cross-Browser (if time)

```
1. [ ] Repeat critical tests in:
    - [ ] Firefox
    - [ ] Safari (if available)
    - [ ] Chrome
2. [ ] Document browser-specific issues
```

---

## 🐛 KNOWN ISSUES & WORKAROUNDS

### Issue 1: Back Navigation from ReviewGrid

**Severity:** LOW  
**Status:** ⚠️ KNOWN

```
Symptoms:
├─ Browser back button may not work correctly
├─ Returns to campaign list instead of campaign detail
└─ Lost unsaved approvals

Workaround:
├─ Use breadcrumb navigation instead
├─ Don't rely on browser back button
├─ Save frequently by approving
└─ Can revisit ReviewGrid from campaign detail

Testing Note:
├─ DOCUMENT behavior
├─ DO NOT mark as blocker
├─ Plan fix for next release
```

### Issue 2: Export ZIP Structure

**Severity:** MEDIUM  
**Status:** ⚠️ NEEDS VERIFICATION

```
Symptoms:
├─ ZIP file may have duplicate files
├─ Folder structure inconsistent
├─ Large exports (>100MB) timeout
└─ File names may have encoding issues

Workaround:
├─ Smaller exports (5-10 assets) work reliably
├─ Re-download if failed
├─ Check file integrity with 7-Zip
└─ Manual cleanup of ZIP if needed

Testing Note:
├─ TEST with various export sizes
├─ DOCUMENT file sizes that work/fail
├─ Report max working export size
```

### Issue 3: Mobile Touch Performance

**Severity:** MEDIUM  
**Status:** ⚠️ NEEDS OPTIMIZATION

```
Symptoms:
├─ Slow scrolling on Review Grid (mobile)
├─ Button taps sometimes register twice
├─ Hover states don't apply (mobile)
└─ Long hold might trigger context menu

Workaround:
├─ Use desktop for heavy operations
├─ Wait between taps
├─ Disable long-press context menu in mobile
└─ Use landscape mode for better performance

Testing Note:
├─ TEST on real mobile device
├─ DOCUMENT performance metrics
├─ Report device models tested
```

### Issue 4: Large File Upload Timeout

**Severity:** MEDIUM  
**Status:** ⚠️ NEEDS CONFIGURATION

```
Symptoms:
├─ Files >30MB timeout after 30 seconds
├─ No retry mechanism
├─ Upload progress stalls
└─ User must restart

Workaround:
├─ Compress image before upload
├─ Use image optimizer tool first
├─ Upload files <25MB for reliability
└─ Check internet connection quality

Testing Note:
├─ TEST with 25MB, 30MB, 40MB files
├─ DOCUMENT which sizes work
├─ MEASURE upload time vs file size
```

### Issue 5: API Rate Limiting

**Severity:** LOW  
**Status:** ⚠️ NOT YET IMPLEMENTED

```
Symptoms:
├─ Can't generate multiple captions simultaneously
├─ OpenAI API rate limit may be hit
├─ Error: "Rate limit exceeded"
└─ Long queue time

Workaround:
├─ Wait 5-10 minutes between large batches
├─ Generate fewer assets per batch
├─ Stagger generation across day
└─ Contact support for rate limit increase

Testing Note:
├─ TEST concurrent generations
├─ DOCUMENT rate limit behavior
├─ SUGGEST queuing mechanism
```

---

## 🔧 DEBUG COMMANDS

### Backend Debugging

**Check Server Status**

```bash
curl -s http://localhost:3001/api/auth/me | jq .
# Expected: { userId, email, agencyId } or 401 error
```

**Check Database Connection**

```bash
# From backend directory
npm run prisma studio
# Opens Prisma Studio on http://localhost:5555
```

**View Recent Logs**

```bash
# Backend logs (if running with nodemon)
tail -f backend/logs/app.log | jq .

# Or check console output if terminal still open
```

**Test API Endpoint**

```bash
# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# List workspaces (with cookie)
curl -X GET http://localhost:3001/api/workspaces \
  -H "Cookie: session=<SESSION_ID>"
```

### Frontend Debugging

**Check Console Messages**

```
Open browser DevTools (F12)
│
├─ Console tab: Look for errors/warnings
├─ Network tab: Check API calls (200/400/500)
├─ Application tab: Check localStorage/cookies
├─ React DevTools: Inspect component state
└─ Performance tab: Profile loading/rendering
```

**Local Storage Inspection**

```javascript
// In browser console
localStorage.getItem('workspaceId');
localStorage.getItem('campaignId');
localStorage.getItem('theme');

// Clear all
localStorage.clear();
```

**API Call Debugging**

```javascript
// In browser console
// View last API response
fetch('http://localhost:3001/api/workspaces')
  .then((r) => r.json())
  .then((data) => console.log(data));
```

### Database Debugging

**Connect to SQLite**

```bash
# From any directory
sqlite3 /Users/pranay/Projects/caption-art/backend/app.sqlite

# Common queries
.tables                          # List all tables
SELECT COUNT(*) FROM agencies;   # Count agencies
SELECT * FROM users LIMIT 5;     # View 5 users
```

**Prisma CLI**

```bash
# From backend directory

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name "description"

# Inspect database
npx prisma studio

# Format schema
npx prisma format
```

---

## ⚡ QUICK TEST PATHS

### 5-Minute Smoke Test

```
1. Login (30s)
2. View workspaces (30s)
3. Create campaign (1m)
4. Upload 1 asset (1m)
5. Generate caption (1.5m)
6. Verify in review (30s)

Total: ~5.5 minutes
Pass/Fail: System working yes/no
```

### 15-Minute Quick Test

```
1. Authentication (2m)
   └─ Login, logout, login again
2. Create campaign (2m)
   └─ Full campaign setup
3. Upload assets (3m)
   └─ 5 assets
4. Generate (5m)
   └─ Full generation job
5. Review (3m)
   └─ Approve all

Total: ~15 minutes
Pass/Fail: Full workflow yes/no
```

### 30-Minute Full Test

```
1. Authentication (3m)
2. Workspace management (3m)
3. Brand kit creation (3m)
4. Campaign setup (3m)
5. Asset upload (3m)
6. Caption generation (5m)
7. Mask generation (2m)
8. Review & approval (3m)
9. Export (2m)

Total: ~30 minutes
Pass/Fail: All features yes/no
```

### Regression Test (60 minutes)

```
Run all test cases in:
├─ TESTING_GUIDE_PART_1_PAGES_ROUTES.md
├─ TESTING_GUIDE_PART_2_WORKFLOWS_FEATURES.md
├─ TESTING_GUIDE_PART_3_USE_CASES_SCENARIOS.md
└─ This file (Part 4)

Document results for each:
├─ PASS
├─ FAIL
└─ BLOCKED (with reason)
```

---

## 📋 TEST SUMMARY TEMPLATE

```markdown
# Test Summary Report

**Date:** [Date]  
**Tester:** [Name]  
**Environment:** [Dev/Staging/Production]  
**Browser:** [Chrome/Firefox/Safari/Mobile]  
**Duration:** [Time spent]

## Results Summary

- Total Tests: [ ]
- Passed: [ ]
- Failed: [ ]
- Blocked: [ ]
- Pass Rate: [ ]%

## Critical Issues (Blockers)

1. [Issue description]
   - Steps to reproduce: [...]
   - Expected: [...]
   - Actual: [...]
   - Severity: CRITICAL

## Major Issues (High Priority)

1. [Issue description]
   - [Same structure as above]

## Minor Issues (Low Priority)

1. [Issue description]
   - [Same structure as above]

## Recommendations

- [ ] Recommendation 1
- [ ] Recommendation 2

## Sign-Off

- Approved for release: [ ] YES / [ ] NO
- Date: [Date]
- Signature: [Name]
```

---

**END OF TESTING GUIDE**

**Complete Documentation:**

- **Part 1:** Pages, Routes & Navigation
- **Part 2:** Features, Workflows & User Flows
- **Part 3:** Use Cases & Testing Scenarios
- **Part 4:** Testing Matrix & Quick Reference (this file)

**Total Pages:** 4 comprehensive guides  
**Total Test Cases:** 200+ covered  
**Estimated Full Test Time:** 2-3 hours
