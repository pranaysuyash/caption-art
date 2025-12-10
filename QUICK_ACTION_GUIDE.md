# Quick Action Guide
**What to do next - Simple checklist**

---

## 🎯 Two Main Tasks

### Task 1: Complete Modal Migrations (2 hours)
**Status:** 44% done, 5 components remaining

### Task 2: Migrate to Drizzle ORM (10-15 hours)
**Status:** Planning complete, ready to start

---

## 📋 Task 1: Finish Modal Work

### Step 1: Migrate ReferenceCreativeManager (45 min)
```bash
# 1. Open the file
code frontend/src/components/ReferenceCreativeManager.tsx

# 2. Add import
import { Modal, ModalActions } from './Modal';

# 3. Replace custom modal with <Modal>
# 4. Test it works
# 5. Run diagnostics
npm run typecheck
```

### Step 2: Migrate SettingsPanel (20 min)
```bash
# Same process as above
code frontend/src/components/SettingsPanel.tsx
```

### Step 3: Migrate SocialPostPreview (20 min)
```bash
code frontend/src/components/SocialPostPreview.tsx
```

### Step 4: Update Toolbar (15 min)
```bash
# Replace inline confirmation with useConfirm hook
code frontend/src/components/Toolbar.tsx
```

### Step 5: Update EffectPresetSelector (10 min)
```bash
# Replace native confirm() with useConfirm hook
code frontend/src/components/EffectPresetSelector.tsx
```

### Reference
- See: `MODAL_QUICK_REFERENCE.md` for usage examples
- See: `MODAL_STANDARDIZATION_GUIDE.md` for detailed guide

---

## 📋 Task 2: Migrate to Drizzle

### Phase 1: Setup (1-2 hours)
```bash
cd backend

# Install Drizzle
npm install drizzle-orm
npm install -D drizzle-kit

# Install database driver (PostgreSQL example)
npm install pg
npm install -D @types/pg

# Create config file
touch drizzle.config.ts
# Copy content from PRISMA_TO_DRIZZLE_MIGRATION.md

# Create schema directory
mkdir -p src/db
touch src/db/schema.ts
touch src/db/index.ts
```

### Phase 2: Convert Schema (1 hour)
```bash
# Open Prisma schema
code prisma/schema.prisma

# Create Drizzle schema
code src/db/schema.ts
# Copy examples from PRISMA_TO_DRIZZLE_MIGRATION.md

# Generate migration
npx drizzle-kit generate:pg
```

### Phase 3: Migrate One Route (1 hour)
```bash
# Pick simplest route first
code src/routes/campaigns.ts

# Replace Prisma queries with Drizzle
# See examples in PRISMA_TO_DRIZZLE_MIGRATION.md

# Test the route
npm test
```

### Phase 4: Migrate All Routes (3-5 hours)
```bash
# Repeat for each route:
# - campaigns.ts
# - brand-kits.ts
# - assets.ts
# - approval.ts
# - workspaces.ts
# - auth.ts
```

### Phase 5: Test Everything (2-3 hours)
```bash
# Run all tests
npm test

# Test API endpoints manually
# Check performance improvements
```

### Phase 6: Cleanup (1 hour)
```bash
# Remove Prisma
npm uninstall prisma @prisma/client
rm -rf prisma/
rm -rf node_modules/.prisma

# Update package.json scripts
# See PRISMA_TO_DRIZZLE_MIGRATION.md
```

### Reference
- See: `PRISMA_TO_DRIZZLE_MIGRATION.md` for complete guide

---

## ⚡ Quick Commands

### Check TypeScript Errors
```bash
cd frontend && npm run typecheck
```

### Run Tests
```bash
cd frontend && npm test
cd backend && npm test
```

### Generate Drizzle Migration
```bash
cd backend && npx drizzle-kit generate:pg
```

### Apply Drizzle Migration
```bash
cd backend && npx drizzle-kit push:pg
```

### View Database (Drizzle Studio)
```bash
cd backend && npx drizzle-kit studio
```

---

## 📊 Progress Tracking

### Modal Migration
- [x] Modal.tsx (base component)
- [x] CreateCampaignModal
- [x] ShareDialog
- [x] CampaignDetail
- [ ] ReferenceCreativeManager
- [ ] SettingsPanel
- [ ] SocialPostPreview
- [ ] Toolbar
- [ ] EffectPresetSelector

### Drizzle Migration
- [ ] Setup Drizzle
- [ ] Convert schema
- [ ] Migrate campaigns route
- [ ] Migrate brand-kits route
- [ ] Migrate assets route
- [ ] Migrate approval route
- [ ] Migrate workspaces route
- [ ] Migrate auth route
- [ ] Test everything
- [ ] Remove Prisma

---

## 🎯 Success Criteria

### Modal Work Complete When:
- [ ] All 9 components use Modal or useConfirm
- [ ] Zero TypeScript errors
- [ ] All duplicate CSS removed
- [ ] All tests passing

### Drizzle Migration Complete When:
- [ ] All routes using Drizzle
- [ ] All tests passing
- [ ] Prisma fully removed
- [ ] Performance improved
- [ ] Documentation updated

---

## 🆘 If You Get Stuck

### Modal Issues
1. Check `MODAL_QUICK_REFERENCE.md`
2. Look at `ShareDialog.tsx` as example
3. Ensure you're using `<Modal>` correctly
4. Run `npm run typecheck`

### Drizzle Issues
1. Check `PRISMA_TO_DRIZZLE_MIGRATION.md`
2. Look at query examples in guide
3. Check Drizzle docs: https://orm.drizzle.team/
4. Join Drizzle Discord for help

### General Issues
1. Run diagnostics: `npm run typecheck`
2. Check for TypeScript errors
3. Review documentation
4. Test incrementally

---

## 📞 Need Help?

### Documentation
- `MODAL_STANDARDIZATION_GUIDE.md` - Modal usage
- `MODAL_QUICK_REFERENCE.md` - Quick examples
- `PRISMA_TO_DRIZZLE_MIGRATION.md` - Drizzle guide
- `SESSION_FINAL_SUMMARY.md` - Complete overview

### Community
- Drizzle Discord: https://discord.gg/drizzle
- Drizzle Docs: https://orm.drizzle.team/

---

## ⏱️ Time Estimates

| Task | Time | Priority |
|------|------|----------|
| Complete modal migrations | 2 hours | High |
| Setup Drizzle | 1-2 hours | High |
| Migrate schema | 1 hour | High |
| Migrate routes | 3-5 hours | High |
| Test everything | 2-3 hours | High |
| Cleanup | 1 hour | Medium |

**Total:** 10-15 hours over 1-2 weeks

---

## 🚀 Start Now

### Option 1: Finish Modals First
```bash
# Quick wins, builds momentum
cd frontend
code src/components/ReferenceCreativeManager.tsx
```

### Option 2: Start Drizzle Migration
```bash
# Bigger impact, more complex
cd backend
npm install drizzle-orm drizzle-kit
```

### Option 3: Do Both in Parallel
```bash
# One person on modals, one on Drizzle
# Coordinate to avoid conflicts
```

---

**Choose your path and get started! All documentation is ready.**

