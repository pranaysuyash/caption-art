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

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      log.info('SIGINT received, shutting down Prisma client...')
      await prisma.$disconnect()
      process.exit(0)
    })

    process.on('SIGTERM', async () => {
      log.info('SIGTERM received, shutting down Prisma client...')
      await prisma.$disconnect()
      process.exit(0)
    })
  }

  return prisma
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
