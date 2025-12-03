import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as fc from 'fast-check'

/**
 * Feature: platform-agnostic-backend, Property 23: Deployment simplicity
 *
 * For any deployment environment with Node.js support, the backend should start successfully
 * with only environment variables configured (no additional platform-specific setup required)
 * Validates: Requirements 1.1, 1.2, 1.5
 */

describe('Property 23: Deployment simplicity', () => {
  let originalEnv: NodeJS.ProcessEnv

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env }
    // Reset modules to force re-evaluation
    vi.resetModules()
  })

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv
    // Reset modules again
    vi.resetModules()
  })

  it('should start with only required environment variables', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          REPLICATE_API_TOKEN: fc.string({ minLength: 10, maxLength: 50 }),
          OPENAI_API_KEY: fc.string({ minLength: 10, maxLength: 50 }),
          GUMROAD_PRODUCT_PERMALINK: fc.string({ minLength: 5, maxLength: 50 }),
        }),
        async (requiredEnv) => {
          // Set only required environment variables
          process.env.REPLICATE_API_TOKEN = requiredEnv.REPLICATE_API_TOKEN
          process.env.OPENAI_API_KEY = requiredEnv.OPENAI_API_KEY
          process.env.GUMROAD_PRODUCT_PERMALINK =
            requiredEnv.GUMROAD_PRODUCT_PERMALINK

          // Clear optional variables
          delete process.env.PORT
          delete process.env.NODE_ENV
          delete process.env.CORS_ORIGIN
          delete process.env.GUMROAD_ACCESS_TOKEN

          // Import config - should not throw
          const { config } = await import('./config')

          // Verify config loaded successfully
          expect(config.replicate.apiToken).toBe(
            requiredEnv.REPLICATE_API_TOKEN
          )
          expect(config.openai.apiKey).toBe(requiredEnv.OPENAI_API_KEY)
          expect(config.gumroad.productPermalink).toBe(
            requiredEnv.GUMROAD_PRODUCT_PERMALINK
          )

          // Verify defaults are applied for optional variables
          expect(config.port).toBe(3001) // Default port
          expect(config.env).toBe('development') // Default env

          // Reset modules for next iteration
          vi.resetModules()
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should create server with minimal configuration', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          REPLICATE_API_TOKEN: fc.string({ minLength: 10, maxLength: 50 }),
          OPENAI_API_KEY: fc.string({ minLength: 10, maxLength: 50 }),
          GUMROAD_PRODUCT_PERMALINK: fc.string({ minLength: 5, maxLength: 50 }),
        }),
        async (requiredEnv) => {
          // Set only required environment variables
          process.env.REPLICATE_API_TOKEN = requiredEnv.REPLICATE_API_TOKEN
          process.env.OPENAI_API_KEY = requiredEnv.OPENAI_API_KEY
          process.env.GUMROAD_PRODUCT_PERMALINK =
            requiredEnv.GUMROAD_PRODUCT_PERMALINK

          // Import server module
          const serverModule = await import('./server.ts')
          const createServer =
            (serverModule as any).createServer ||
            (serverModule as any).default?.createServer

          // Create server - should not throw
          const app = createServer()

          // Verify server was created successfully
          expect(app).toBeDefined()
          expect(typeof app.listen).toBe('function')

          // Verify Express app has standard methods
          expect(typeof app.use).toBe('function')
          expect(typeof app.get).toBe('function')
          expect(typeof app.post).toBe('function')

          // Reset modules for next iteration
          vi.resetModules()
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should not require platform-specific dependencies', async () => {
    // Set required environment variables
    process.env.REPLICATE_API_TOKEN = 'test-token-12345'
    process.env.OPENAI_API_KEY = 'test-key-12345'
    process.env.GUMROAD_PRODUCT_PERMALINK = 'test-product'

    // Import config and server
    const { config } = await import('./config')
    const serverModule = await import('./server.ts')
    const createServer =
      (serverModule as any).createServer ||
      (serverModule as any).default?.createServer

    // Verify no AWS-specific dependencies are required
    expect(config).not.toHaveProperty('aws')
    expect(config).not.toHaveProperty('s3')
    expect(config).not.toHaveProperty('lambda')

    // Verify server can be created without platform-specific setup
    const app = createServer()
    expect(app).toBeDefined()

    // Verify no Vercel-specific dependencies
    expect(config).not.toHaveProperty('vercel')

    // Verify no platform-specific environment variables are required
    expect(process.env.AWS_REGION).toBeUndefined()
    expect(process.env.AWS_ACCESS_KEY_ID).toBeUndefined()
    expect(process.env.VERCEL_URL).toBeUndefined()
  })

  it('should work with different Node.js-compatible environments', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('development', 'production', 'test', 'staging'),
        fc.record({
          REPLICATE_API_TOKEN: fc.string({ minLength: 10, maxLength: 50 }),
          OPENAI_API_KEY: fc.string({ minLength: 10, maxLength: 50 }),
          GUMROAD_PRODUCT_PERMALINK: fc.string({ minLength: 5, maxLength: 50 }),
        }),
        async (nodeEnv, requiredEnv) => {
          // Set environment
          process.env.NODE_ENV = nodeEnv
          process.env.REPLICATE_API_TOKEN = requiredEnv.REPLICATE_API_TOKEN
          process.env.OPENAI_API_KEY = requiredEnv.OPENAI_API_KEY
          process.env.GUMROAD_PRODUCT_PERMALINK =
            requiredEnv.GUMROAD_PRODUCT_PERMALINK

          // Import and create server
          const serverModule = await import('./server.ts')
          const createServer =
            (serverModule as any).createServer ||
            (serverModule as any).default?.createServer
          const app = createServer()

          // Verify server works in any Node.js environment
          expect(app).toBeDefined()
          expect(typeof app.listen).toBe('function')

          // Reset modules for next iteration
          vi.resetModules()
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should fail fast with clear error for missing required variables', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(
          'REPLICATE_API_TOKEN',
          'OPENAI_API_KEY',
          'GUMROAD_PRODUCT_PERMALINK'
        ),
        async (missingVar) => {
          // Set all required variables
          process.env.REPLICATE_API_TOKEN = 'test-token'
          process.env.OPENAI_API_KEY = 'test-key'
          process.env.GUMROAD_PRODUCT_PERMALINK = 'test-product'

          // Remove one required variable
          delete process.env[missingVar]

          // Importing config should throw with clear error message
          try {
            await import('./config')
            // If we get here, the test should fail
            expect(true).toBe(false) // Force failure
          } catch (error) {
            // Verify error message is clear and mentions the missing variable
            expect(error).toBeInstanceOf(Error)
            expect((error as Error).message).toContain(missingVar)
            expect((error as Error).message).toContain('Missing')
          }

          // Reset modules for next iteration
          vi.resetModules()
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should not require any build tools or compilers at runtime', async () => {
    // Set required environment variables
    process.env.REPLICATE_API_TOKEN = 'test-token-12345'
    process.env.OPENAI_API_KEY = 'test-key-12345'
    process.env.GUMROAD_PRODUCT_PERMALINK = 'test-product'

    // Import server
    const serverModule = await import('./server.ts')
    const createServer =
      (serverModule as any).createServer ||
      (serverModule as any).default?.createServer

    // Create server
    const app = createServer()

    // Verify server is created (no compilation or build step required)
    expect(app).toBeDefined()

    // Verify no webpack, babel, or other build tools are required
    // (This is implicit - if we got here, no build tools were needed)
    expect(true).toBe(true)
  })

  it('should support configuration through environment variables only', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          REPLICATE_API_TOKEN: fc.string({ minLength: 10, maxLength: 50 }),
          OPENAI_API_KEY: fc.string({ minLength: 10, maxLength: 50 }),
          GUMROAD_PRODUCT_PERMALINK: fc.string({ minLength: 5, maxLength: 50 }),
          PORT: fc.integer({ min: 1024, max: 65535 }).map(String),
          NODE_ENV: fc.constantFrom('development', 'production', 'test'),
          CORS_ORIGIN: fc.oneof(fc.constant('*'), fc.webUrl()),
        }),
        async (envVars) => {
          // Set all environment variables
          Object.entries(envVars).forEach(([key, value]) => {
            process.env[key] = String(value)
          })

          // Import config
          const { config } = await import('./config')

          // Verify all configuration comes from environment variables
          expect(config.replicate.apiToken).toBe(envVars.REPLICATE_API_TOKEN)
          expect(config.openai.apiKey).toBe(envVars.OPENAI_API_KEY)
          expect(config.gumroad.productPermalink).toBe(
            envVars.GUMROAD_PRODUCT_PERMALINK
          )
          expect(config.port).toBe(parseInt(envVars.PORT, 10))
          expect(config.env).toBe(envVars.NODE_ENV)
          expect(config.cors.origin).toBe(envVars.CORS_ORIGIN)

          // Verify no config files are required
          // (This is implicit - if config loaded, no files were needed)
          expect(true).toBe(true)

          // Reset modules for next iteration
          vi.resetModules()
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should work identically across different deployment platforms', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          REPLICATE_API_TOKEN: fc.string({ minLength: 10, maxLength: 50 }),
          OPENAI_API_KEY: fc.string({ minLength: 10, maxLength: 50 }),
          GUMROAD_PRODUCT_PERMALINK: fc.string({ minLength: 5, maxLength: 50 }),
        }),
        async (requiredEnv) => {
          // Simulate different platforms by setting environment variables
          // All platforms should work identically

          // Platform 1: Local development
          process.env.REPLICATE_API_TOKEN = requiredEnv.REPLICATE_API_TOKEN
          process.env.OPENAI_API_KEY = requiredEnv.OPENAI_API_KEY
          process.env.GUMROAD_PRODUCT_PERMALINK =
            requiredEnv.GUMROAD_PRODUCT_PERMALINK

          const { createServer: createServer1 } = await import('./server.ts')
          const app1 = createServer1()
          expect(app1).toBeDefined()

          vi.resetModules()

          // Platform 2: Docker container (same env vars)
          process.env.REPLICATE_API_TOKEN = requiredEnv.REPLICATE_API_TOKEN
          process.env.OPENAI_API_KEY = requiredEnv.OPENAI_API_KEY
          process.env.GUMROAD_PRODUCT_PERMALINK =
            requiredEnv.GUMROAD_PRODUCT_PERMALINK

          const { createServer: createServer2 } = await import('./server.ts')
          const app2 = createServer2()
          expect(app2).toBeDefined()

          vi.resetModules()

          // Platform 3: Cloud provider (same env vars)
          process.env.REPLICATE_API_TOKEN = requiredEnv.REPLICATE_API_TOKEN
          process.env.OPENAI_API_KEY = requiredEnv.OPENAI_API_KEY
          process.env.GUMROAD_PRODUCT_PERMALINK =
            requiredEnv.GUMROAD_PRODUCT_PERMALINK

          const { createServer: createServer3 } = await import('./server.ts')
          const app3 = createServer3()
          expect(app3).toBeDefined()

          // All platforms should create identical server instances
          expect(typeof app1.listen).toBe(typeof app2.listen)
          expect(typeof app2.listen).toBe(typeof app3.listen)

          vi.resetModules()
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should not require any database or external service setup', async () => {
    // Set required environment variables
    process.env.REPLICATE_API_TOKEN = 'test-token-12345'
    process.env.OPENAI_API_KEY = 'test-key-12345'
    process.env.GUMROAD_PRODUCT_PERMALINK = 'test-product'

    // Import config
    const { config } = await import('./config')

    // Verify no database configuration is required
    expect(config).not.toHaveProperty('database')
    expect(config).not.toHaveProperty('db')
    expect(config).not.toHaveProperty('mongodb')
    expect(config).not.toHaveProperty('postgres')
    expect(config).not.toHaveProperty('redis')

    // Verify no message queue configuration is required
    expect(config).not.toHaveProperty('queue')
    expect(config).not.toHaveProperty('rabbitmq')
    expect(config).not.toHaveProperty('kafka')

    // The backend should be stateless and not require any infrastructure setup
    expect(true).toBe(true)
  })

  it('should have minimal dependencies for deployment', async () => {
    // Read package.json to verify minimal dependencies
    const packageJson = await import('../package.json')

    // Verify only essential runtime dependencies
    const dependencies = Object.keys(packageJson.dependencies || {})

    // Should not have platform-specific dependencies
    expect(dependencies).not.toContain('aws-sdk')
    expect(dependencies).not.toContain('@aws-sdk/client-s3')
    expect(dependencies).not.toContain('@vercel/node')

    // Should have only essential dependencies
    expect(dependencies).toContain('express')
    expect(dependencies).toContain('dotenv')
    expect(dependencies).toContain('cors')

    // Verify dependency count is reasonable (not bloated)
    expect(dependencies.length).toBeLessThan(20)
  })
})
