/**
 * Prisma Client Initialization
 *
 * This module initializes the Prisma ORM client for database operations.
 * It's configured to work with PostgreSQL and includes error handling
 * and connection management.
 */

import { PrismaClient } from '@prisma/client'
import { log } from '../middleware/logger'

let prisma: PrismaClient

/**
 * Get or create Prisma client instance (singleton pattern)
 */
export function getPrismaClient(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      log:
        process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    })
  }

  return prisma
}

/**
 * Register graceful shutdown handlers for Prisma. This is intentionally
 * separate from `getPrismaClient()` to avoid attaching process-level
 * handlers during test runs or during simple module imports. Call this
 * from `startServer()` in environments where we actually run as the
 * primary application process.
 */
export function registerPrismaSignalHandlers(): void {
  if (process.env.NODE_ENV === 'test') return
  if (!prisma) return

  const handler = async (signal: string) => {
    log.info(`${signal} received, shutting down Prisma client...`)
    try {
      await prisma.$disconnect()
    } catch (err) {
      log.error({ err }, 'Error while disconnecting Prisma client on shutdown')
    }
    // Only exit if this is the top-level process
    try {
      process.exit(0)
    } catch (e) {
      // ignore
    }
  }

  // Register signal handlers - avoid duplicate registrations
  process.once('SIGINT', () => handler('SIGINT'))
  process.once('SIGTERM', () => handler('SIGTERM'))
}

/**
 * Initialize Prisma and test connection
 */
export async function initializePrisma(): Promise<void> {
  try {
    const client = getPrismaClient()

    // Test connection
    const result = await client.$queryRaw`SELECT 1 as test`

    if (result) {
      log.info('✓ Prisma connected to PostgreSQL database')
    }
  } catch (error) {
    log.error(
      { err: error },
      'Failed to connect to database. Ensure DATABASE_URL is set and PostgreSQL is running.'
    )
    throw error
  }
}

/**
 * Disconnect Prisma client
 */
export async function disconnectPrisma(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect()
  }
}

// Export Prisma types for convenient imports
export type { PrismaClient } from '@prisma/client'
export * from '@prisma/client'
