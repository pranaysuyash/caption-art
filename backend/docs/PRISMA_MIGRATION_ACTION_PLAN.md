# Backend Route Migration to Prisma - Action Plan

**Status:** In Progress  
**Database:** Hybrid (SQLite local dev, PostgreSQL production)  
**Already Migrated:** User, Agency  
**Remaining:** 15-20 routes using AuthModel in-memory

---

## Migration Priority (Critical Path First)

### Phase 1: Core Data Models (Days 1-2)

These models are dependencies for downstream operations.

| Route         | Model     | Current                   | Prisma                  | Priority |
| ------------- | --------- | ------------------------- | ----------------------- | -------- |
| `/workspaces` | Workspace | AuthModel.createWorkspace | prisma.workspace.create | 🔴 High  |
| `/brandKits`  | BrandKit  | AuthModel.createBrandKit  | prisma.brandKit.create  | 🔴 High  |
| `/campaigns`  | Campaign  | AuthModel.createCampaign  | prisma.campaign.create  | 🔴 High  |
| `/assets`     | Asset     | AssetModel.\*             | prisma.asset.\*         | 🔴 High  |

### Phase 2: Processing & Generation (Days 3-4)

These depend on Phase 1 models existing.

| Route          | Model                     | Priority  |
| -------------- | ------------------------- | --------- |
| `/caption`     | Caption, CaptionVariation | 🟡 Medium |
| `/mask`        | Mask                      | 🟡 Medium |
| `/adCreatives` | AdCreative                | 🟡 Medium |
| `/batch`       | BatchJob                  | 🟡 Medium |

### Phase 3: Secondary Operations (Days 5+)

These are lower priority, can work with or without Prisma.

| Route        | Model        | Priority |
| ------------ | ------------ | -------- |
| `/approval`  | Approval     | 🟢 Low   |
| `/export`    | ExportJob    | 🟢 Low   |
| `/dashboard` | (aggregates) | 🟢 Low   |

---

## Migration Pattern Template

### Step 1: Replace in-memory calls with Prisma

**Before (AuthModel):**

```typescript
const workspace = AuthModel.createWorkspace(agencyId, clientName, industry)
```

**After (Prisma):**

```typescript
import { getPrismaClient } from '../lib/prisma'

const prisma = getPrismaClient()
const workspace = await prisma.workspace.create({
  data: {
    agencyId,
    clientName,
    industry,
  },
})
```

### Step 2: Update error handling

**Before:**

```typescript
const workspace = AuthModel.getWorkspaceById(id)
if (!workspace) return res.status(404).json({ error: 'Not found' })
```

**After:**

```typescript
const workspace = await prisma.workspace.findUnique({
  where: { id },
})
if (!workspace) return res.status(404).json({ error: 'Not found' })
```

### Step 3: Make routes async

Most Prisma operations need `async/await`.

---

## Workspace Migration (Route 1/20)

**File:** `backend/src/routes/workspaces.ts`  
**Current Size:** 168 lines  
**Estimated Effort:** 2-3 hours (includes testing)

### Key Changes:

1. Import Prisma client
2. Replace `AuthModel.getWorkspacesByAgency()` → `prisma.workspace.findMany()`
3. Replace `AuthModel.createWorkspace()` → `prisma.workspace.create()`
4. Replace `AuthModel.getWorkspaceById()` → `prisma.workspace.findUnique()`
5. Replace `AuthModel.updateWorkspace()` → `prisma.workspace.update()`
6. Update default BrandKit creation to use Prisma
7. Add proper error handling for Prisma errors

---

## BrandKits Migration (Route 2/20)

**File:** `backend/src/routes/brandKits.ts`  
**Current Size:** ~150 lines  
**Estimated Effort:** 2-3 hours

### Key Changes:

1. Replace all `AuthModel.createBrandKit()` calls
2. Replace all `AuthModel.getBrandKit*()` reads
3. Update `updateBrandKit()` with Prisma operations
4. Handle JSON field storage (colors, fonts, forbidden phrases, etc.)

**Note:** Prisma stores JSON as native JSON columns, much cleaner than in-memory arrays.

---

## Campaigns Migration (Route 3/20)

**File:** `backend/src/routes/campaigns.ts`  
**Current Size:** 319 lines  
**Estimated Effort:** 3-4 hours

### Key Changes:

1. Replace `AuthModel.createCampaign()` calls
2. Add Prisma `include` for related BrandKit
3. Update filtering/querying to Prisma syntax
4. Handle `briefData` JSON field

---

## Assets Migration (Route 4/20)

**File:** `backend/src/routes/assets.ts`  
**Current Size:** ~250 lines  
**Estimated Effort:** 2-3 hours

### Key Changes:

1. Replace `AssetModel.createAsset()` calls
2. Update `AssetModel.getAssetsByWorkspace()` → prisma queries
3. Handle file upload S3 integration
4. Add proper cascade delete handling

---

## Total Effort Estimate

| Phase     | Routes         | Total Hours     | Dependencies      |
| --------- | -------------- | --------------- | ----------------- |
| Phase 1   | 4 routes       | 10-12 hours     | None              |
| Phase 2   | 4 routes       | 12-14 hours     | Phase 1           |
| Phase 3   | 3+ routes      | 8-10 hours      | Phase 1           |
| **Total** | **11+ routes** | **30-36 hours** | **2-3 days work** |

---

## Database Initialization

### First Run

When app starts with SQLite and no `app.sqlite` exists:

1. Prisma auto-creates the file
2. Schema gets applied (no migrations needed for SQLite)
3. App runs against fresh database

### For Production (PostgreSQL)

1. Set `DATABASE_URL=postgresql://...`
2. Run `npx prisma migrate deploy` (applies all migrations)
3. Database ready for production

---

## Testing Strategy

### Unit Tests

- Mock Prisma client for each route
- Test error scenarios
- Verify data validation

### Integration Tests

- Create real SQLite test database
- Run full workflow end-to-end
- Verify relationships and cascades

### Manual Testing

1. Create workspace
2. Create brand kit
3. Create campaign
4. Upload assets
5. Generate captions
6. Verify data in SQLite

---

## Rollback Plan (if needed)

Each route migration is independent:

- If migration breaks, revert that file only
- Other routes continue working with their current approach
- Can mix Prisma and AuthModel calls temporarily

---

## Next Steps (Ready to Start)

1. ✅ Database decision made (Hybrid - SQLite dev, PostgreSQL prod)
2. ✅ Prisma schema complete (14 models defined)
3. ✅ Prisma client initialized
4. ⏳ **Start Phase 1 migrations (workspaces, brandKits, campaigns, assets)**
5. ⏳ Test Phase 1 end-to-end
6. ⏳ Move to Phase 2 (captions, masks, creatives)

**Starting with:** `/workspaces` route migration

---

## Commands Reference

```bash
# Test database connection
npx prisma db pull

# Create migration (for PostgreSQL later)
npx prisma migrate dev --name add_new_model

# Apply migrations to production
npx prisma migrate deploy

# Reset SQLite (dev only)
npx prisma migrate reset

# Open interactive Prisma Studio
npx prisma studio

# Generate Prisma client types
npx prisma generate
```

---

**Recommended Start Time:** Now (Phase 1 can be completed 2-3 days)  
**Database Ready After:** All phase 1 + 2 routes migrated (5-7 days)
