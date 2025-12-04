# Production Deployment Guide - Prisma ORM

**Last Updated:** December 4, 2025  
**For:** Caption Art Backend with Prisma ORM

## Quick Start (5 minutes)

### Prerequisites

- PostgreSQL database URL (cloud or self-hosted)
- Node.js 18+ installed
- Environment access for setting DATABASE_URL

### Step 1: Set Environment Variable

```bash
# For production environment
export DATABASE_URL="postgresql://user:password@host:port/caption_art_db"

# Or add to .env.production
echo "DATABASE_URL=postgresql://user:password@host:port/caption_art_db" >> backend/.env.production
```

### Step 2: Deploy Schema

```bash
cd backend

# Apply all migrations to production database
npx prisma migrate deploy

# Verify schema created
npx prisma db execute --stdin < query.sql
```

### Step 3: Start Server

```bash
# Set production environment
NODE_ENV=production npm start

# Or with environment variable
DATABASE_URL="postgresql://..." NODE_ENV=production npm start
```

---

## Environment-Specific Configuration

### Development (SQLite)

```env
# .env
DATABASE_URL="file:./app.sqlite"
NODE_ENV="development"
```

### Production (PostgreSQL)

```env
# .env.production
DATABASE_URL="postgresql://user:password@host.rds.amazonaws.com:5432/caption_art_db"
NODE_ENV="production"
PRISMA_LOG_LEVEL="error"
```

---

## PostgreSQL Setup

### AWS RDS (Recommended)

```bash
# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier caption-art-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username postgres \
  --master-user-password YOUR_PASSWORD \
  --allocated-storage 20 \
  --publicly-accessible false

# Get connection string
aws rds describe-db-instances \
  --db-instance-identifier caption-art-db \
  --query 'DBInstances[0].Endpoint'
```

### Self-Hosted PostgreSQL

```bash
# Local PostgreSQL
DATABASE_URL="postgresql://postgres:password@localhost:5432/caption_art_db"

# Docker PostgreSQL
docker run --name caption-art-db \
  -e POSTGRES_PASSWORD=secure_password \
  -e POSTGRES_DB=caption_art_db \
  -p 5432:5432 \
  -d postgres:15
```

---

## Migration Strategy

### Zero-Downtime Migration

#### Phase 1: Dual Write (Current State)

- ✅ Prisma writing to SQLite
- ✅ Ready to migrate to PostgreSQL

#### Phase 2: Run Migration

```bash
# 1. Create PostgreSQL database
createdb -U postgres caption_art_db

# 2. Apply schema
npx prisma migrate deploy

# 3. Verify schema
npx prisma db execute --stdin <<EOF
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public';
EOF
```

#### Phase 3: Data Transfer (if needed)

```bash
# Export SQLite data
sqlite3 app.sqlite ".mode csv" ".output export.csv" "SELECT * FROM workspaces;"

# Import to PostgreSQL (using Prisma seed if complex)
npx ts-node prisma/seed.ts
```

#### Phase 4: Failover

```bash
# Update DATABASE_URL to PostgreSQL
# Restart server
NODE_ENV=production npm start
```

---

## Production Checklist

### Pre-Deployment

- [ ] PostgreSQL database created and accessible
- [ ] DATABASE_URL environment variable set
- [ ] .env.production configured
- [ ] All Prisma migrations reviewed
- [ ] Backup of existing SQLite database taken

### Deployment

- [ ] Run `npx prisma migrate deploy`
- [ ] Verify schema created (14 tables)
- [ ] Test database connection
- [ ] Run E2E test against production
- [ ] Monitor server logs

### Post-Deployment

- [ ] Verify all endpoints responding
- [ ] Check database query performance
- [ ] Enable Prisma query logging if needed
- [ ] Monitor error rates
- [ ] Set up database backups

---

## Monitoring & Logging

### Enable Query Logging

```bash
# Set in production environment
export PRISMA_LOG_LEVEL="query"
# Or for all events
export PRISMA_LOG_LEVEL="debug"
```

### Connection Pool Monitoring

```typescript
// In server startup
const prisma = new PrismaClient({
  log: [
    { emit: 'stdout', level: 'query' },
    { emit: 'stdout', level: 'error' },
    { emit: 'stdout', level: 'warn' },
  ],
});

prisma.$on('beforeExit', async () => {
  console.log('Prisma client shutting down');
});
```

### Performance Monitoring

```bash
# Monitor slow queries
export PRISMA_LOG_LEVEL="warn"
export DATABASE_LOG_LEVEL="debug"
```

---

## Rollback Procedure

### If Issues Occur

```bash
# 1. Stop server
pkill -f "npm start"

# 2. Revert to SQLite
export DATABASE_URL="file:./app.sqlite"

# 3. Restart server
npm start

# 4. Diagnose PostgreSQL connection issue
npx prisma db execute --stdin < test_query.sql
```

### Rollback Migration

```bash
# If migration failed, list migrations
npx prisma migrate status

# Resolve issues
npx prisma migrate resolve --rolled-back "migration_name"
```

---

## Troubleshooting

### Error: "FATAL: Ident authentication failed"

```bash
# Use password authentication in connection string
DATABASE_URL="postgresql://user:password@host:port/db"
```

### Error: "Database connection timeout"

```bash
# Check PostgreSQL is accessible
psql -h host -U user -d caption_art_db -c "SELECT 1"

# Add connection timeout in DATABASE_URL
DATABASE_URL="postgresql://user:password@host:port/db?connect_timeout=10"
```

### Error: "SSL required"

```bash
# Add SSL parameter
DATABASE_URL="postgresql://user:password@host:port/db?sslmode=require"
```

### Error: "Prisma Client not generated"

```bash
# Regenerate Prisma Client
npx prisma generate

# Or with build
npm run build
```

---

## Performance Tuning

### Connection Pooling (PgBouncer)

```bash
# Install PgBouncer
brew install pgbouncer  # macOS
apt-get install pgbouncer  # Linux

# Configure for pooling
export DATABASE_URL="postgresql://user:password@pgbouncer:6432/db"
```

### Query Optimization

```typescript
// Use select to limit columns
const workspaces = await prisma.workspace.findMany({
  select: { id: true, clientName: true, agencyId: true },
  where: { agencyId },
  take: 50, // Pagination
  skip: 0,
});
```

### Index Creation

```sql
-- Create indexes for common queries (already in schema)
CREATE INDEX idx_workspaces_agencyId ON workspaces(agencyId);
CREATE INDEX idx_campaigns_workspaceId ON campaigns(workspaceId);
CREATE INDEX idx_assets_workspaceId ON assets(workspaceId);
```

---

## Backup & Recovery

### Automated Backups

```bash
# Using pg_dump for PostgreSQL
pg_dump -U postgres caption_art_db > backup_$(date +%Y%m%d).sql

# Restore from backup
psql -U postgres caption_art_db < backup_20251204.sql
```

### Using AWS RDS Automated Backups

```bash
# Create snapshot
aws rds create-db-snapshot \
  --db-instance-identifier caption-art-db \
  --db-snapshot-identifier caption-art-snapshot-$(date +%s)

# Restore from snapshot (creates new instance)
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier caption-art-restored \
  --db-snapshot-identifier caption-art-snapshot-xxxxx
```

---

## Support & Resources

### Documentation Links

- [Prisma Documentation](https://www.prisma.io/docs/)
- [PostgreSQL Connection Strings](https://www.postgresql.org/docs/current/libpq-connect.html)
- [AWS RDS PostgreSQL](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_PostgreSQL.html)

### Common Commands

```bash
# Check Prisma version
npx prisma --version

# List available migrations
npx prisma migrate status

# Reset database (dev only!)
npx prisma migrate reset

# Create backup
npx prisma db pull  # Generate schema from existing DB

# Sync schema with database
npx prisma db push
```

---

## Success Indicators

After deployment, verify:

✅ Server starts without errors
✅ All 8 migrated endpoints respond (200 OK)
✅ Authentication works (401 for unauthenticated)
✅ Data persists across server restarts
✅ Database backups functional
✅ Performance acceptable (< 100ms per query)

---

**Status:** Ready for production deployment  
**Next Step:** Execute deployment plan in secure environment
