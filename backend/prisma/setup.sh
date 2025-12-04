#!/bin/bash
# Prisma Setup Script for Caption Art Backend
# This script initializes the Prisma ORM for PostgreSQL

set -e

echo "🗄️ Caption Art - Prisma Setup"
echo ""

# Check if PostgreSQL is available
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL CLI not found. Please install PostgreSQL."
    echo "   macOS: brew install postgresql@15"
    echo "   Linux: apt-get install postgresql-client"
    echo "   Windows: https://www.postgresql.org/download/windows/"
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please create it using .env.example"
    exit 1
fi

echo "✓ Prerequisites checked"
echo ""

# Read DATABASE_URL from .env
DB_URL=$(grep "^DATABASE_URL=" .env | cut -d= -f2- | tr -d '\r')

if [ -z "$DB_URL" ]; then
    echo "❌ DATABASE_URL not found in .env"
    exit 1
fi

echo "Using database URL: $DB_URL"
echo ""

# Create database if it doesn't exist
echo "📦 Creating database..."
psql "$DB_URL" -c "SELECT 1" &>/dev/null || {
    # Extract database name from URL
    DB_NAME=$(echo "$DB_URL" | sed -E 's/.*\/([^?]+).*/\1/')
    ADMIN_URL=$(echo "$DB_URL" | sed -E "s/\/[^\/]+\?/\/postgres\?/; s/\/[^\/]+$/\/postgres/")
    
    echo "Creating database: $DB_NAME"
    psql "$ADMIN_URL" -c "CREATE DATABASE \"$DB_NAME\";" || true
}

echo "✓ Database ready"
echo ""

# Run Prisma migrations
echo "🔄 Running Prisma migrations..."
npx prisma migrate deploy

echo "✓ Migrations complete"
echo ""

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

echo "✓ Prisma client generated"
echo ""

# Seed database (optional)
if [ -f prisma/seed.ts ]; then
    echo "🌱 Seeding database..."
    npx ts-node prisma/seed.ts
    echo "✓ Database seeded"
    echo ""
fi

echo "✅ Prisma setup complete!"
echo ""
echo "Next steps:"
echo "  1. Update backend routes to use Prisma client"
echo "  2. Run migrations in production: npx prisma migrate deploy"
echo "  3. View database: npx prisma studio"
echo ""
