# Postgres + Prisma Migration Guide

## Overview

This guide explains how to migrate Caption Art backend from in-memory storage to PostgreSQL with Prisma ORM.

## Phase 1: Setup (✅ Complete)

### 1.1 Installed Dependencies

- `@prisma/client` - Prisma ORM client
- `prisma` - Prisma CLI for migrations
- `@prisma/internals` - Internal utilities

### 1.2 Created Prisma Schema

- Located at: `backend/prisma/schema.prisma`
- Includes models for:
  - **Agency** - Billing and licensing
  - **User** - User accounts
  - **Workspace** - Client projects
  - **BrandKit** - Brand guidelines
  - **Campaign** - Marketing campaigns
  - **Asset** - Images/media
  - **Caption** - Generated captions
  - **CaptionVariation** - Caption alternatives
  - **Mask** - Background masks
  - **AdCreative** - Multi-format ads
  - **Approval** - Review workflow
  - **BatchJob** - Background operations
  - **ExportJob** - Export tracking
  - **PerformanceMetric** - Analytics

### 1.3 Updated Environment

- Added `DATABASE_URL` to `.env`:
  ```
  DATABASE_URL=postgresql://localhost:5432/caption_art_dev
  ```

### 1.4 Created Setup Script

- Located at: `backend/prisma/setup.sh`
- Automates database creation and Prisma initialization

## Phase 2: Database Setup (Next Steps)

### 2.1 Install PostgreSQL

**macOS:**

```bash
brew install postgresql@15
brew services start postgresql@15
```

**Linux (Ubuntu/Debian):**

```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Docker (Recommended):**

```bash
docker run --name caption-art-db \
  -e POSTGRES_PASSWORD=dev-password \
  -e POSTGRES_DB=caption_art_dev \
  -p 5432:5432 \
  -d postgres:15-alpine
```

### 2.2 Update DATABASE_URL

Create the database and update `.env`:

```bash
# If using Docker, the default URL works:
DATABASE_URL=postgresql://postgres:dev-password@localhost:5432/caption_art_dev

# If using local PostgreSQL:
createdb caption_art_dev
DATABASE_URL=postgresql://localhost/caption_art_dev
```

### 2.3 Run Prisma Setup

```bash
cd backend
chmod +x prisma/setup.sh
./prisma/setup.sh
```

Or manually:

```bash
cd backend
npx prisma migrate deploy
npx prisma generate
```

## Phase 3: Backend Route Migration (Implementation)

This phase involves updating backend routes to use Prisma instead of in-memory models.

### 3.1 Update Authentication Routes

**File:** `src/routes/auth.ts`

Replace `AuthModel` calls with Prisma:

```typescript
// OLD (in-memory):
const user = AuthModel.getUserByEmail(email)

// NEW (Prisma):
const user = await prisma.user.findUnique({
  where: { email },
})
```

### 3.2 Update Workspace Routes

**File:** `src/routes/workspaces.ts`

```typescript
// OLD:
const workspace = WorkspaceModel.createWorkspace(agencyId, clientName)

// NEW:
const workspace = await prisma.workspace.create({
  data: {
    agencyId,
    clientName,
    industry,
    brandKit: {
      create: { agencyId }, // Create default brand kit
    },
  },
})
```

### 3.3 Update Asset Routes

**File:** `src/routes/assets.ts`

```typescript
// OLD:
const asset = AssetModel.createAsset(workspaceId, file)

// NEW:
const asset = await prisma.asset.create({
  data: {
    workspaceId,
    campaignId,
    originalName: file.originalname,
    mimeType: file.mimetype,
    url: s3Url,
    size: file.size,
    width: imageMetadata.width,
    height: imageMetadata.height,
  },
})
```

### 3.4 Update Caption Routes

**File:** `src/routes/caption.ts`

```typescript
// OLD:
const caption = CaptionModel.createCaption(assetId, { baseCaption, variants })

// NEW:
const caption = await prisma.caption.create({
  data: {
    workspaceId,
    assetId,
    baseCaption,
    variations: {
      createMany: {
        data: variants.map((v) => ({ text: v, tone: 'default' })),
      },
    },
    qualityScore: calculateQuality(baseCaption),
    status: 'completed',
    approvalStatus: 'pending',
  },
  include: { variations: true },
})
```

### 3.5 Update Approval Routes

**File:** `src/routes/approval.ts`

```typescript
// OLD:
AuthModel.approveCaption(captionId)

// NEW:
const caption = await prisma.caption.update({
  where: { id: captionId },
  data: {
    approvalStatus: 'approved',
    approvedAt: new Date(),
  },
})

// Also create approval record
await prisma.approval.create({
  data: {
    workspaceId: caption.workspaceId,
    captionId,
    status: 'approved',
    reviewedBy: req.user.id,
    reviewedAt: new Date(),
  },
})
```

### 3.6 Update Batch Job Routes

**File:** `src/routes/batch.ts`

```typescript
// OLD:
const job = AuthModel.createBatchJob(workspaceId, assetIds)

// NEW:
const job = await prisma.batchJob.create({
  data: {
    workspaceId,
    jobType: 'caption',
    status: 'pending',
    itemsTotal: assetIds.length,
    result: {
      assetIds, // Store job params
      template,
    },
  },
})
```

## Phase 4: Testing & Validation

### 4.1 Update Tests

Replace in-memory setup with database seeding:

```typescript
// Before each test:
beforeEach(async () => {
  // Clear all tables (careful with order due to foreign keys!)
  await prisma.caption.deleteMany()
  await prisma.asset.deleteMany()
  await prisma.workspace.deleteMany()

  // Seed test data
  testWorkspace = await prisma.workspace.create({
    data: {
      agencyId: 'test-agency',
      clientName: 'Test Client',
    },
  })
})

// After all tests:
afterAll(async () => {
  await prisma.$disconnect()
})
```

### 4.2 Run Test Suite

```bash
npm run test
```

### 4.3 Integration Tests

```bash
# Start dev server
npm run dev

# In another terminal, run integration tests
npm run test:integration
```

## Phase 5: Production Deployment

### 5.1 Database Setup

Use a managed PostgreSQL service:

**Options:**

- **AWS RDS** - Enterprise-grade, auto-backups
- **Supabase** - PostgreSQL + Auth + Realtime
- **Railway** - Simple, pay-per-use
- **Heroku PostgreSQL** - Easy setup, good for MVPs

### 5.2 Update Environment

```bash
# Production .env
DATABASE_URL=postgresql://user:password@prod-host:5432/caption_art_prod
NODE_ENV=production
```

### 5.3 Run Migrations

```bash
npx prisma migrate deploy
```

### 5.4 Monitor & Backup

```bash
# View query logs
npx prisma studio

# Export data for backup
pg_dump $DATABASE_URL > backup.sql
```

## Phase 6: Legacy Code Cleanup

Once all routes are migrated to Prisma:

1. **Remove old models** (safe to delete):
   - `src/models/auth.ts` (in-memory storage)
   - `src/models/Workspace.ts`
   - `src/models/Asset.ts`
   - `src/models/Caption.ts`
   - `src/models/BatchJob.ts`

2. **Update imports** throughout routes to use Prisma client

3. **Remove SQLite dependencies** from package.json:
   ```bash
   npm uninstall better-sqlite3 connect-sqlite3
   ```

## Troubleshooting

### Issue: "DATABASE_URL is not set"

**Solution:**

```bash
# Check .env file
cat backend/.env | grep DATABASE_URL

# If missing, add it:
echo "DATABASE_URL=postgresql://localhost/caption_art_dev" >> .env
```

### Issue: "connect ECONNREFUSED"

**Solution:**

```bash
# PostgreSQL not running. Start it:
# macOS:
brew services start postgresql@15

# Linux:
sudo systemctl start postgresql

# Docker:
docker start caption-art-db
```

### Issue: "ERROR: permission denied"

**Solution:**

```bash
# Check PostgreSQL user permissions:
psql -U postgres -c "ALTER USER postgres WITH PASSWORD 'password';"
```

### Issue: "Missing Prisma client"

**Solution:**

```bash
npx prisma generate
```

## Performance Considerations

1. **Connection Pooling** - Add PgBouncer for prod:

   ```
   DATABASE_URL=postgresql://user:pass@host/db?schema=public
   ```

2. **Indexing** - Schema already includes optimal indexes on:
   - Foreign keys (workspaceId, campaignId, etc.)
   - Lookup fields (email, status)
   - Filter fields (approvalStatus, recordedAt)

3. **Query Optimization** - Use `include`/`select` for eager loading:
   ```typescript
   const campaign = await prisma.campaign.findUnique({
     where: { id },
     include: {
       assets: true,
       captions: { include: { variations: true } },
     },
   })
   ```

## Next Steps

1. ✅ Phase 1 - Setup (COMPLETE)
2. ⏳ Phase 2 - Database Setup
3. ⏳ Phase 3 - Backend Route Migration
4. ⏳ Phase 4 - Testing & Validation
5. ⏳ Phase 5 - Production Deployment
6. ⏳ Phase 6 - Legacy Code Cleanup

**Estimated Timeline:** 2-3 days for full migration
