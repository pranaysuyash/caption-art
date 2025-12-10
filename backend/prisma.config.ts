import path from 'node:path'
import { defineConfig } from 'prisma/config'

// For SQLite, the URL is the path to the database file
const databaseUrl = process.env.DATABASE_URL || 'file:./prisma/dev.db'

export default defineConfig({
  schema: path.join(__dirname, 'prisma', 'schema.prisma'),
  
  // Datasource configuration for migrations
  datasource: {
    url: databaseUrl,
  },
  
  // Migrate configuration for SQLite adapter
  migrate: {
    async adapter() {
      const { PrismaBetterSQLite3 } = await import('@prisma/adapter-better-sqlite3')
      const Database = (await import('better-sqlite3')).default
      
      // Extract file path from DATABASE_URL
      const dbPath = databaseUrl.replace('file:', '')
      const resolvedPath = path.resolve(__dirname, dbPath)
      const db = new Database(resolvedPath)
      return new PrismaBetterSQLite3(db)
    },
  },
})
