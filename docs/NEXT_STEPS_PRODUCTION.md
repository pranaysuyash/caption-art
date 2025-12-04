# Next Steps: Production Deployment Checklist

**Current Status:** Phase 1 & 2 Prisma migration complete (8 routes, 46 endpoints, 0 errors)  
**Goal:** Deploy to production with persistent database within 2-3 days

---

## 🚀 Quick Start (Local Testing)

### 1. Initialize Prisma & Database (5 minutes)

```bash
cd backend

# Generate Prisma Client
npx prisma generate

# Create SQLite database with initial migration
npx prisma migrate dev --name initial_migration

# Verify database created
ls -la app.sqlite
```

### 2. Start Backend (2 minutes)

```bash
# Terminal 1: Start backend server
npm run dev

# Should see:
# ✅ Prisma Client initialized
# ✅ Database connection successful
# ✅ Server listening on port 3001
```

### 3. Test Core Endpoints (10 minutes)

```bash
# Test workspace creation
curl -X POST http://localhost:3001/api/workspaces \
  -H "Content-Type: application/json" \
  -d '{"clientName":"Test Client","industry":"Technology"}'

# Test brand kit creation
curl -X POST http://localhost:3001/api/brand-kits \
  -H "Content-Type: application/json" \
  -d '{"workspaceId":"<workspace-id>","primaryColor":"#FF0000"}'

# Test campaign creation
curl -X POST http://localhost:3001/api/campaigns \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Campaign","brandKitId":"<brandkit-id>",...}'
```

### 4. Test Frontend Integration (5 minutes)

```bash
# Terminal 2: Start frontend
cd frontend
npm run dev

# Navigate to http://localhost:5173
# Test workspace creation, brand kit setup, campaign creation
```

---

## 📋 Complete Testing Checklist

### Phase 1 Routes (CRITICAL)

- [ ] **Workspaces**

  - [ ] Create workspace
  - [ ] List workspaces
  - [ ] Get workspace by ID
  - [ ] Update workspace
  - [ ] Delete workspace (soft delete)
  - [ ] Verify default BrandKit created

- [ ] **BrandKits**

  - [ ] Create brand kit
  - [ ] Get brand kit by ID
  - [ ] Update brand kit colors/fonts
  - [ ] Delete brand kit
  - [ ] Get brand kit by workspace
  - [ ] Get masking models

- [ ] **Campaigns**

  - [ ] Create campaign
  - [ ] List campaigns (by agency)
  - [ ] List campaigns (by workspace)
  - [ ] Get campaign by ID
  - [ ] Update campaign
  - [ ] Delete campaign
  - [ ] Launch campaign
  - [ ] Pause campaign

- [ ] **Assets**
  - [ ] Upload asset(s)
  - [ ] List assets by workspace
  - [ ] Get asset by ID
  - [ ] Delete asset
  - [ ] Verify file storage

### Phase 2 Routes (IMPORTANT)

- [ ] **Caption**

  - [ ] Generate caption (single)
  - [ ] Start batch generation
  - [ ] Get batch job status
  - [ ] List caption templates

- [ ] **Mask**

  - [ ] Generate mask

- [ ] **AdCreatives**

  - [ ] Generate ad creative
  - [ ] List ad creatives
  - [ ] Get ad creative by ID
  - [ ] Update ad creative
  - [ ] Delete ad creative
  - [ ] Duplicate ad creative
  - [ ] Analyze ad creative
  - [ ] Generate ad copy
  - [ ] Generate multiple ad copy variations
  - [ ] Analyze campaign context
  - [ ] Generate campaign prompt

- [ ] **Batch**
  - [ ] Start batch generation
  - [ ] Get batch job by ID
  - [ ] List batch jobs by workspace
  - [ ] List captions by workspace
  - [ ] Update caption (add variation)
  - [ ] Delete caption

### Integration Tests

- [ ] **End-to-End Workflow**

  - [ ] Create workspace → BrandKit → Campaign
  - [ ] Upload asset
  - [ ] Generate caption
  - [ ] Generate mask
  - [ ] Create ad creative
  - [ ] Approve creative
  - [ ] Export creative

- [ ] **Agency Isolation**

  - [ ] Create 2 agencies
  - [ ] Verify Agency A cannot access Agency B resources
  - [ ] Verify workspace filtering works correctly

- [ ] **Error Handling**
  - [ ] Test invalid IDs (404)
  - [ ] Test unauthorized access (403)
  - [ ] Test validation errors (400)
  - [ ] Test missing required fields

---

## 🔧 Production Setup

### 1. Environment Variables

Create `.env.production`:

```bash
# Database
DATABASE_PROVIDER="postgresql"
DATABASE_URL="postgresql://user:password@host:5432/captionart?schema=public"

# API Keys (from existing config)
OPENAI_API_KEY="..."
REPLICATE_API_TOKEN="..."
ANTHROPIC_API_KEY="..."

# Server
NODE_ENV="production"
PORT=3001
```

### 2. PostgreSQL Setup

**Option A: Render.com (Recommended)**

```bash
# 1. Create PostgreSQL database on Render
# 2. Copy connection string
# 3. Update DATABASE_URL in production env
```

**Option B: AWS RDS**

```bash
# 1. Create RDS PostgreSQL instance
# 2. Configure security groups
# 3. Copy connection string
# 4. Update DATABASE_URL in production env
```

**Option C: Heroku Postgres**

```bash
# 1. Add Heroku Postgres addon
# 2. Connection string auto-configured
```

### 3. Run Production Migration

```bash
cd backend

# Set production environment
export DATABASE_URL="postgresql://..."
export DATABASE_PROVIDER="postgresql"

# Run migration
npx prisma migrate deploy

# Verify
npx prisma db pull
```

### 4. Deploy Backend

**Option A: Render.com**

```bash
# 1. Connect GitHub repo
# 2. Set environment variables
# 3. Build command: cd backend && npm install && npx prisma generate
# 4. Start command: cd backend && npm start
```

**Option B: Railway.app**

```bash
# 1. Connect GitHub repo
# 2. Set environment variables
# 3. Auto-detects Node.js and builds
```

**Option C: AWS EC2**

```bash
# SSH to instance
git clone <repo>
cd caption-art/backend
npm install
npx prisma generate
npx prisma migrate deploy
pm2 start npm --name "caption-art-backend" -- start
```

### 5. Deploy Frontend

**Option A: Vercel**

```bash
# 1. Connect GitHub repo
# 2. Set root directory: frontend
# 3. Environment variable: VITE_API_URL=<backend-url>
# 4. Auto-deploys on push
```

**Option B: Netlify**

```bash
# 1. Connect GitHub repo
# 2. Base directory: frontend
# 3. Build command: npm run build
# 4. Publish directory: dist
```

---

## 🐛 Troubleshooting

### Issue: "Prisma Client not generated"

```bash
cd backend
npx prisma generate
```

### Issue: "Database connection failed"

```bash
# Check DATABASE_URL format
echo $DATABASE_URL

# Test connection
npx prisma db pull
```

### Issue: "Migration failed"

```bash
# Reset database (DEV ONLY)
npx prisma migrate reset

# Or force push schema
npx prisma db push --force-reset
```

### Issue: "Type errors after migration"

```bash
# Regenerate Prisma types
npx prisma generate

# Restart TypeScript server in VSCode
# Cmd+Shift+P → "TypeScript: Restart TS Server"
```

### Issue: "Cannot find module '@prisma/client'"

```bash
cd backend
npm install @prisma/client
npx prisma generate
```

---

## 📊 Monitoring & Observability

### 1. Add Logging

```typescript
// backend/src/lib/prisma.ts
prisma.$use(async (params, next) => {
  const before = Date.now();
  const result = await next(params);
  const after = Date.now();

  log.debug(
    {
      model: params.model,
      action: params.action,
      duration: after - before,
    },
    'Prisma query'
  );

  return result;
});
```

### 2. Monitor Query Performance

```bash
# Enable Prisma query logging
export DEBUG="prisma:query"
npm run dev
```

### 3. Set Up Error Tracking

- **Sentry:** Track production errors
- **LogRocket:** Session replay + errors
- **DataDog:** APM + database monitoring

---

## 🔄 Rollback Plan

### If Issues Arise

1. **Revert to AuthModel (Emergency)**

```bash
git checkout main  # or previous stable branch
npm install
npm run dev
```

2. **Database Rollback**

```bash
# Restore from backup
pg_restore -d captionart backup.dump

# Or reset to specific migration
npx prisma migrate resolve --rolled-back <migration-name>
```

3. **Gradual Rollback (Hybrid Mode)**

- Keep Phase 1 routes on Prisma
- Revert Phase 2 routes to AuthModel
- Test and debug individual routes

---

## ✅ Production Readiness Checklist

### Code Quality

- [x] Zero TypeScript errors
- [x] All routes migrated
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] Load tests performed

### Database

- [x] Schema finalized
- [x] Migrations created
- [ ] Seed data prepared
- [ ] Backup strategy defined
- [ ] Connection pooling configured

### Security

- [ ] Environment variables secured
- [ ] API authentication working
- [ ] Rate limiting enabled
- [ ] CORS configured
- [ ] SQL injection protection (Prisma handles this)

### Performance

- [ ] Query optimization done
- [ ] Indexes added where needed
- [ ] Caching strategy defined
- [ ] CDN configured (for assets)

### Monitoring

- [ ] Error tracking set up
- [ ] Performance monitoring enabled
- [ ] Database metrics tracked
- [ ] Alerts configured

### Documentation

- [x] Migration guide written
- [x] API documentation updated
- [ ] Deployment guide created
- [ ] Team trained on new system

---

## 🎯 Success Metrics

### Before Launch

- All 46 endpoints returning correct data
- Response times < 200ms (local), < 500ms (production)
- Zero 500 errors in testing
- All integration tests passing

### After Launch (Week 1)

- 99.9% uptime
- < 500ms average response time
- < 1% error rate
- Database queries < 100ms p95

---

## 📞 Support Contacts

If issues arise:

1. Check this document first
2. Review [PRISMA_MIGRATION_COMPLETE.md](./PRISMA_MIGRATION_COMPLETE.md)
3. Consult Prisma docs: https://www.prisma.io/docs
4. GitHub Issues: Report any migration-related bugs

---

**Last Updated:** December 4, 2025  
**Status:** Ready for testing → production deployment
