# Prisma ORM Quick Reference - Caption Art Backend

**Last Updated:** December 4, 2025  
**For:** Developers working with migrated routes

---

## 🚀 Quick Start Commands

```bash
# Development (SQLite)
cd backend
npm install
npx prisma generate
npm start

# Production (PostgreSQL)
export DATABASE_URL="postgresql://user:pass@host:5432/db"
npx prisma migrate deploy
NODE_ENV=production npm start

# Testing
npm test
npx jest
```

---

## 🗄️ Database Access

### View Data (Development)

```bash
# Start Prisma Studio (UI browser at localhost:5555)
npx prisma studio

# Query directly
sqlite3 app.sqlite "SELECT * FROM workspaces LIMIT 5;"
```

### Query Patterns (All 8 Routes)

#### Workspaces Route

```typescript
// Get all workspaces for agency
const workspaces = await prisma.workspace.findMany({
  where: { agencyId },
  include: { brandKit: true },
});

// Create workspace with default brand kit
const workspace = await prisma.workspace.create({
  data: {
    agencyId,
    clientName,
    industry,
    brandKit: {
      create: {
        agencyId,
        primaryColor: '#FF6B6B',
        // ... other defaults
      },
    },
  },
  include: { brandKit: true },
});
```

#### Brand Kits Route

```typescript
// Get brand kit for workspace
const brandKit = await prisma.brandKit.findUnique({
  where: { id: brandKitId },
  include: { workspace: true },
});

// Update brand kit
await prisma.brandKit.update({
  where: { id },
  data: { primaryColor, secondaryColor /* ... */ },
});
```

#### Campaigns Route

```typescript
// List campaigns with filtering
const campaigns = await prisma.campaign.findMany({
  where: {
    workspace: { agencyId },
    // ... filters
  },
  include: { workspace: true, brandKit: true },
});

// Create campaign
const campaign = await prisma.campaign.create({
  data: {
    workspaceId,
    brandKitId,
    name,
    objective,
    launchType,
    funnelStage,
    placements: ['ig-feed', 'fb-feed'],
  },
});
```

#### Assets Route

```typescript
// List assets for workspace
const assets = await prisma.asset.findMany({
  where: { workspace: { agencyId, id: workspaceId } },
  take: 50,
});

// Upload asset (metadata)
const asset = await prisma.asset.create({
  data: {
    workspaceId,
    agencyId,
    fileName,
    fileUrl,
    fileSize,
    mimeType,
  },
});
```

#### Caption Route (Batch Jobs)

```typescript
// Create batch job
const job = await prisma.batchJob.create({
  data: {
    workspaceId,
    jobType: 'caption_generation',
    status: 'pending',
  },
});

// Update job status
await prisma.batchJob.update({
  where: { id: jobId },
  data: { status: 'completed' },
});
```

#### Batch Route (Complex)

```typescript
// Get batch job with variations
const job = await prisma.batchJob.findUnique({
  where: { id: jobId },
  include: {
    captions: {
      include: { variations: true },
    },
  },
});

// Create captions in parallel
const captions = await Promise.all(
  assetIds.map((assetId) =>
    prisma.caption.create({
      data: { workspaceId, assetId, text: '' },
    })
  )
);
```

#### Ad Creatives Route (19 Migrations)

```typescript
// Get creatives with relationships
const creatives = await prisma.adCreative.findMany({
  where: {
    workspace: { agencyId },
  },
  include: {
    campaign: true,
    brandKit: true,
    asset: true,
  },
});

// Create creative
const creative = await prisma.adCreative.create({
  data: {
    workspaceId,
    campaignId,
    assetId,
    style,
    variations: JSON.stringify([]),
  },
});
```

---

## 🔒 Security Patterns

### Always Filter by Agency

```typescript
// ✅ CORRECT - Enforces agency isolation
const data = await prisma.workspace.findMany({
  where: { agencyId: req.agency.id },
});

// ❌ WRONG - Exposes all agencies' data
const data = await prisma.workspace.findMany();
```

### Verify Ownership Before Returning

```typescript
// ✅ CORRECT - Check agency ownership
const workspace = await prisma.workspace.findUnique({
  where: { id },
});
if (workspace.agencyId !== req.agency.id) {
  return res.status(403).json({ error: 'Access denied' });
}

// ❌ WRONG - Return without verification
const workspace = await prisma.workspace.findUnique({ where: { id } });
res.json({ workspace });
```

---

## 🛠️ Common Operations

### Create with Relations

```typescript
const workspace = await prisma.workspace.create({
  data: {
    agencyId,
    clientName,
    industry,
    // Create related brand kit in one go
    brandKit: {
      create: {
        agencyId,
        primaryColor: '#FF6B6B',
      },
    },
  },
  // Return with relations
  include: { brandKit: true },
});
```

### Update Multiple Fields

```typescript
const updated = await prisma.brandKit.update({
  where: { id },
  data: {
    name,
    primaryColor,
    secondaryColor,
    tertiaryColor,
    headingFont,
    bodyFont,
    voicePrompt,
  },
});
```

### Delete with Cascade

```typescript
// Will delete all related records due to @relation onDelete: Cascade
const deleted = await prisma.workspace.delete({
  where: { id },
});
```

### Pagination

```typescript
const workspaces = await prisma.workspace.findMany({
  where: { agencyId },
  take: 10, // Limit
  skip: 0, // Offset
  orderBy: { createdAt: 'desc' },
});
```

### Aggregation

```typescript
const count = await prisma.workspace.count({
  where: { agencyId },
});

const grouped = await prisma.campaign.groupBy({
  by: ['objective'],
  where: { workspace: { agencyId } },
  _count: true,
});
```

---

## 📊 Data Types Reference

### Workspace Model

```typescript
id: string            // CUID
agencyId: string
clientName: string
industry?: string
createdAt: DateTime
updatedAt: DateTime
brandKit: BrandKit?   // Relation
campaigns: Campaign[]
assets: Asset[]
```

### Campaign Model

```typescript
id: string
workspaceId: string
brandKitId: string
name: string
description?: string
objective: enum       // awareness | traffic | conversion | engagement
launchType: enum      // new-launch | evergreen | seasonal | sale | event
funnelStage: enum     // cold | warm | hot
placements: string[]  // Stored as JSON
createdAt: DateTime
updatedAt: DateTime
```

### Asset Model

```typescript
id: string;
workspaceId: string;
agencyId: string;
fileName: string;
fileUrl: string;
fileSize: number;
mimeType: string;
uploadedAt: DateTime;
```

---

## 🐛 Debugging

### Enable Query Logging

```bash
# Set environment variable
export PRISMA_LOG_LEVEL="query"

# Or in code
const prisma = new PrismaClient({
  log: [{ emit: 'stdout', level: 'query' }]
})
```

### Common Errors

| Error                      | Cause                     | Solution                          |
| -------------------------- | ------------------------- | --------------------------------- |
| "Record not found"         | Querying non-existent ID  | Check ID value, handle gracefully |
| "Unique constraint failed" | Duplicate on unique field | Check existing records first      |
| "Foreign key constraint"   | Related record missing    | Create parent before child        |
| "No tables found"          | Migration not applied     | Run `npx prisma migrate dev`      |

### Validate Query

```bash
# Check schema sync
npx prisma validate

# List migrations
npx prisma migrate status

# Generate Prisma Client
npx prisma generate
```

---

## 📈 Performance Tips

### Use Select to Limit Columns

```typescript
// ✅ EFFICIENT - Only fetch needed fields
const workspaces = await prisma.workspace.findMany({
  select: { id: true, clientName: true },
  where: { agencyId },
});

// ❌ SLOW - Fetches all columns
const workspaces = await prisma.workspace.findMany({
  where: { agencyId },
});
```

### Batch Operations

```typescript
// Efficient for multiple creates
const captions = await prisma.caption.createMany({
  data: assetIds.map((id) => ({
    workspaceId,
    assetId: id,
    text: '',
  })),
});
```

### Connection Pool

```bash
# Prisma Data Proxy (managed pooling)
DATABASE_URL="prisma://data.prisma.io?api_key=YOUR_KEY"
```

---

## 🚀 Deployment Checklist

```bash
# Before production
npx prisma generate           # Generate client
npx prisma migrate status     # Check migrations
npx tsc --noEmit             # Check TypeScript

# Deploy
export DATABASE_URL="postgresql://..."
npx prisma migrate deploy
NODE_ENV=production npm start

# Verify
curl http://localhost:3001/api/health
curl http://localhost:3001/api/workspaces  # Should return 401
```

---

## 📚 File Locations

| File                        | Purpose             | Lines |
| --------------------------- | ------------------- | ----- |
| `prisma/schema.prisma`      | Data models         | 358   |
| `src/routes/workspaces.ts`  | Workspace endpoints | 168   |
| `src/routes/brandKits.ts`   | Brand kit endpoints | 328   |
| `src/routes/campaigns.ts`   | Campaign endpoints  | 319   |
| `src/routes/assets.ts`      | Asset endpoints     | 222   |
| `src/routes/caption.ts`     | Caption batch       | 182   |
| `src/routes/adCreatives.ts` | Creative generation | 1106  |
| `src/routes/batch.ts`       | Batch operations    | 284   |

---

## 📞 Getting Help

### Documentation

- [Prisma Docs](https://www.prisma.io/docs/)
- [API Reference](https://www.prisma.io/docs/reference/api-reference)

### Common Tasks

```bash
# Reset database (dev only!)
npx prisma migrate reset

# Create migration
npx prisma migrate dev --name add_feature

# Pull existing schema
npx prisma db pull

# Push schema changes
npx prisma db push
```

### Schema Updates Workflow

```bash
# 1. Modify schema.prisma
# 2. Create migration
npx prisma migrate dev --name descriptive_name

# 3. Generate client
npx prisma generate

# 4. Update routes to use new fields
# 5. Test locally
npm test

# 6. Deploy when ready
npx prisma migrate deploy
```

---

**Version:** 1.0  
**Last Updated:** December 4, 2025  
**Status:** Production Ready ✅
