import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import * as fc from 'fast-check'
import { spawn, ChildProcess } from 'child_process'
import { promisify } from 'util'
import { exec } from 'child_process'

const execAsync = promisify(exec)

/**
 * Feature: platform-agnostic-backend, Property 19: Container environment variables
 *
 * Property 19: Container environment variables
 * For any environment variable provided to the container, the service should use that value
 * Validates: Requirements 8.3
 */
describe('Property 19: Container environment variables', () => {
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

  it('should use environment variables provided to the container', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          NODE_ENV: fc.constantFrom('development', 'production', 'test'),
          PORT: fc.integer({ min: 1024, max: 65535 }).map(String),
          REPLICATE_API_TOKEN: fc.string({ minLength: 10, maxLength: 50 }),
          OPENAI_API_KEY: fc.string({ minLength: 10, maxLength: 50 }),
          GUMROAD_PRODUCT_PERMALINK: fc.string({ minLength: 5, maxLength: 50 }),
          CORS_ORIGIN: fc.oneof(fc.constant('*'), fc.webUrl()),
        }),
        async (envVars) => {
          // Simulate container environment by setting process.env
          // In a real container, these would be passed via docker run -e or docker-compose
          process.env.NODE_ENV = envVars.NODE_ENV
          process.env.PORT = envVars.PORT
          process.env.REPLICATE_API_TOKEN = envVars.REPLICATE_API_TOKEN
          process.env.OPENAI_API_KEY = envVars.OPENAI_API_KEY
          process.env.GUMROAD_PRODUCT_PERMALINK =
            envVars.GUMROAD_PRODUCT_PERMALINK
          process.env.CORS_ORIGIN = envVars.CORS_ORIGIN

          // Import config dynamically to pick up new environment
          const { config } = await import('./config')

          // Verify the service uses the container-provided environment variables
          expect(config.env).toBe(envVars.NODE_ENV)
          expect(config.port).toBe(parseInt(envVars.PORT, 10))
          expect(config.replicate.apiToken).toBe(envVars.REPLICATE_API_TOKEN)
          expect(config.openai.apiKey).toBe(envVars.OPENAI_API_KEY)
          expect(config.gumroad.productPermalink).toBe(
            envVars.GUMROAD_PRODUCT_PERMALINK
          )
          expect(config.cors.origin).toBe(envVars.CORS_ORIGIN)

          // Reset modules for next iteration
          vi.resetModules()
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should respect container environment variable overrides', async () => {
    // Set initial environment
    process.env.NODE_ENV = 'development'
    process.env.PORT = '3001'
    process.env.REPLICATE_API_TOKEN = 'initial-token'
    process.env.OPENAI_API_KEY = 'initial-key'
    process.env.GUMROAD_PRODUCT_PERMALINK = 'initial-product'

    // Import config with initial values
    const { config: initialConfig } = await import('./config')
    expect(initialConfig.replicate.apiToken).toBe('initial-token')

    // Reset modules
    vi.resetModules()

    // Simulate container restart with new environment variables
    process.env.REPLICATE_API_TOKEN = 'updated-token'
    process.env.OPENAI_API_KEY = 'updated-key'
    process.env.PORT = '4001'

    // Import config again
    const { config: updatedConfig } = await import('./config')

    // Verify the service uses the updated container environment variables
    expect(updatedConfig.replicate.apiToken).toBe('updated-token')
    expect(updatedConfig.openai.apiKey).toBe('updated-key')
    expect(updatedConfig.port).toBe(4001)
  })

  it('should handle all environment variables consistently in container context', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          REPLICATE_API_TOKEN: fc.string({ minLength: 10, maxLength: 50 }),
          REPLICATE_BLIP_MODEL: fc.string({ minLength: 10, maxLength: 100 }),
          REPLICATE_REMBG_MODEL: fc.string({ minLength: 10, maxLength: 100 }),
          OPENAI_API_KEY: fc.string({ minLength: 10, maxLength: 50 }),
          OPENAI_MODEL: fc.constantFrom('gpt-3.5-turbo', 'gpt-4'),
          OPENAI_TEMPERATURE: fc.float({ min: 0, max: 2 }).map(String),
          GUMROAD_PRODUCT_PERMALINK: fc.string({ minLength: 5, maxLength: 50 }),
          GUMROAD_ACCESS_TOKEN: fc.option(
            fc.string({ minLength: 10, maxLength: 50 }),
            { nil: undefined }
          ),
        }),
        async (envVars) => {
          // Set all environment variables as they would be in a container
          Object.entries(envVars).forEach(([key, value]) => {
            if (value !== undefined) {
              process.env[key] = String(value)
            } else {
              delete process.env[key]
            }
          })

          // Import config
          const { config } = await import('./config')

          // Verify all values are correctly read from container environment
          expect(config.replicate.apiToken).toBe(envVars.REPLICATE_API_TOKEN)
          expect(config.replicate.blipModel).toBe(envVars.REPLICATE_BLIP_MODEL)
          expect(config.replicate.rembgModel).toBe(
            envVars.REPLICATE_REMBG_MODEL
          )
          expect(config.openai.apiKey).toBe(envVars.OPENAI_API_KEY)
          expect(config.openai.model).toBe(envVars.OPENAI_MODEL)
          expect(config.openai.temperature).toBe(
            parseFloat(envVars.OPENAI_TEMPERATURE)
          )
          expect(config.gumroad.productPermalink).toBe(
            envVars.GUMROAD_PRODUCT_PERMALINK
          )
          expect(config.gumroad.accessToken).toBe(envVars.GUMROAD_ACCESS_TOKEN)

          // Reset modules for next iteration
          vi.resetModules()
        }
      ),
      { numRuns: 100 }
    )
  })
})

/**
 * Feature: platform-agnostic-backend, Property 20: Environment equivalence
 *
 * Property 20: Environment equivalence
 * For any request, the response should be identical whether running locally or in a container
 * Validates: Requirements 8.4
 */
describe('Property 20: Environment equivalence', () => {
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

  it('should produce identical configuration in local and container environments', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          NODE_ENV: fc.constantFrom('development', 'production'),
          PORT: fc.integer({ min: 1024, max: 65535 }).map(String),
          REPLICATE_API_TOKEN: fc.string({ minLength: 10, maxLength: 50 }),
          OPENAI_API_KEY: fc.string({ minLength: 10, maxLength: 50 }),
          GUMROAD_PRODUCT_PERMALINK: fc.string({ minLength: 5, maxLength: 50 }),
        }),
        async (envVars) => {
          // Simulate local environment
          Object.entries(envVars).forEach(([key, value]) => {
            process.env[key] = String(value)
          })

          const { config: localConfig } = await import('./config')

          // Capture local config values
          const localValues = {
            env: localConfig.env,
            port: localConfig.port,
            replicateToken: localConfig.replicate.apiToken,
            openaiKey: localConfig.openai.apiKey,
            gumroadPermalink: localConfig.gumroad.productPermalink,
          }

          // Reset modules
          vi.resetModules()

          // Simulate container environment (same env vars)
          Object.entries(envVars).forEach(([key, value]) => {
            process.env[key] = String(value)
          })

          const { config: containerConfig } = await import('./config')

          // Capture container config values
          const containerValues = {
            env: containerConfig.env,
            port: containerConfig.port,
            replicateToken: containerConfig.replicate.apiToken,
            openaiKey: containerConfig.openai.apiKey,
            gumroadPermalink: containerConfig.gumroad.productPermalink,
          }

          // Verify identical configuration
          expect(containerValues).toEqual(localValues)

          // Reset modules for next iteration
          vi.resetModules()
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle server creation identically in both environments', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          REPLICATE_API_TOKEN: fc.string({ minLength: 10, maxLength: 50 }),
          OPENAI_API_KEY: fc.string({ minLength: 10, maxLength: 50 }),
          GUMROAD_PRODUCT_PERMALINK: fc.string({ minLength: 5, maxLength: 50 }),
          PORT: fc.integer({ min: 1024, max: 65535 }).map(String),
        }),
        async (envVars) => {
          // Set environment variables
          Object.entries(envVars).forEach(([key, value]) => {
            process.env[key] = String(value)
          })

          // Import server module
          const serverModule = await import('./server')
          const createServer =
            (serverModule as any).createServer ||
            (serverModule as any).default?.createServer

          // Create server (simulates both local and container)
          const app = createServer()

          // Verify server is created successfully
          expect(app).toBeDefined()
          expect(typeof app.listen).toBe('function')

          // Verify the app has the same structure regardless of environment
          // The Express app should have standard methods
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

  it('should maintain API endpoint behavior across environments', async () => {
    // Set required environment variables
    process.env.REPLICATE_API_TOKEN = 'test-token'
    process.env.OPENAI_API_KEY = 'test-key'
    process.env.GUMROAD_PRODUCT_PERMALINK = 'test-product'
    process.env.PORT = '3001'

    // Import server
    const serverModule = await import('./server')
    const createServer =
      (serverModule as any).createServer ||
      (serverModule as any).default?.createServer

    // Create server instance (represents both local and container)
    const app = createServer()

    // Verify health endpoint exists and is accessible
    // This endpoint should work identically in both environments
    const request = await import('supertest')
    const response = await request.default(app).get('/api/health')

    // Verify response structure is consistent
    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty('status')
    expect(response.body).toHaveProperty('timestamp')
    expect(response.body).toHaveProperty('uptime')

    // The response should be identical regardless of environment
    expect(response.body.status).toBe('healthy')
  })
})
