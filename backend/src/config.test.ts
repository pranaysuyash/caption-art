import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import * as fc from 'fast-check'

/**
 * Feature: platform-agnostic-backend, Property 1: Configuration from environment variables
 *
 * Property 1: Configuration from environment variables
 * For any configuration value, it should be read from environment variables and not hardcoded in the source code
 * Validates: Requirements 1.3
 */
describe('Property 1: Configuration from environment variables', () => {
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

  it('should read all configuration from environment variables', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          NODE_ENV: fc.constantFrom('development', 'production', 'test'),
          PORT: fc.integer({ min: 1024, max: 65535 }).map(String),
          REPLICATE_API_TOKEN: fc.string({ minLength: 10, maxLength: 50 }),
          REPLICATE_BLIP_MODEL: fc.string({ minLength: 10, maxLength: 100 }),
          REPLICATE_REMBG_MODEL: fc.string({ minLength: 10, maxLength: 100 }),
          OPENAI_API_KEY: fc.string({ minLength: 10, maxLength: 50 }),
          OPENAI_MODEL: fc.constantFrom(
            'gpt-3.5-turbo',
            'gpt-4',
            'gpt-4-turbo'
          ),
          OPENAI_TEMPERATURE: fc.float({ min: 0, max: 2 }).map(String),
          GUMROAD_PRODUCT_PERMALINK: fc.string({ minLength: 5, maxLength: 50 }),
          GUMROAD_ACCESS_TOKEN: fc.option(
            fc.string({ minLength: 10, maxLength: 50 }),
            { nil: undefined }
          ),
          CORS_ORIGIN: fc.oneof(
            fc.constant('*'),
            fc.webUrl(),
            fc
              .array(fc.webUrl(), { minLength: 1, maxLength: 3 })
              .map((arr) => arr.join(','))
          ),
        }),
        async (envVars) => {
          // Set environment variables
          process.env.NODE_ENV = envVars.NODE_ENV
          process.env.PORT = envVars.PORT
          process.env.REPLICATE_API_TOKEN = envVars.REPLICATE_API_TOKEN
          process.env.REPLICATE_BLIP_MODEL = envVars.REPLICATE_BLIP_MODEL
          process.env.REPLICATE_REMBG_MODEL = envVars.REPLICATE_REMBG_MODEL
          process.env.OPENAI_API_KEY = envVars.OPENAI_API_KEY
          process.env.OPENAI_MODEL = envVars.OPENAI_MODEL
          process.env.OPENAI_TEMPERATURE = envVars.OPENAI_TEMPERATURE
          process.env.GUMROAD_PRODUCT_PERMALINK =
            envVars.GUMROAD_PRODUCT_PERMALINK
          if (envVars.GUMROAD_ACCESS_TOKEN) {
            process.env.GUMROAD_ACCESS_TOKEN = envVars.GUMROAD_ACCESS_TOKEN
          } else {
            delete process.env.GUMROAD_ACCESS_TOKEN
          }
          process.env.CORS_ORIGIN = envVars.CORS_ORIGIN

          // Import config dynamically
          const { config } = await import('./config')

          // Verify all values come from environment variables
          expect(config.env).toBe(envVars.NODE_ENV)
          expect(config.port).toBe(parseInt(envVars.PORT, 10))
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
          expect(config.cors.origin).toBe(envVars.CORS_ORIGIN)

          // Reset modules for next iteration
          vi.resetModules()
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should use default values when optional environment variables are not set', async () => {
    // Set only required environment variables
    process.env.REPLICATE_API_TOKEN = 'test-token'
    process.env.OPENAI_API_KEY = 'test-key'
    process.env.GUMROAD_PRODUCT_PERMALINK = 'test-product'

    // Clear optional variables
    delete process.env.NODE_ENV
    delete process.env.PORT
    delete process.env.REPLICATE_BLIP_MODEL
    delete process.env.REPLICATE_REMBG_MODEL
    delete process.env.OPENAI_MODEL
    delete process.env.OPENAI_TEMPERATURE
    delete process.env.GUMROAD_ACCESS_TOKEN
    delete process.env.CORS_ORIGIN

    // Import config
    const { config } = await import('./config')

    // Verify defaults are used
    expect(config.env).toBe('development')
    expect(config.port).toBe(3001)
    expect(config.replicate.blipModel).toContain('salesforce/blip')
    expect(config.replicate.rembgModel).toContain('cjwbw/rembg')
    expect(config.openai.model).toBe('gpt-3.5-turbo')
    expect(config.openai.temperature).toBe(0.8)
    expect(config.cors.origin).toBe('*')
  })
})

/**
 * Feature: platform-agnostic-backend, Property 4: Missing environment variable handling
 *
 * Property 4: Missing environment variable handling
 * For any required environment variable that is missing, the service should fail to start with a clear error message indicating which variable is missing
 * Validates: Requirements 2.3, 9.5
 */
describe('Property 4: Missing environment variable handling', () => {
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

  it('should fail with clear error message when required environment variables are missing', async () => {
    const requiredVars = [
      'REPLICATE_API_TOKEN',
      'OPENAI_API_KEY',
      'GUMROAD_PRODUCT_PERMALINK',
    ]

    await fc.assert(
      fc.asyncProperty(fc.constantFrom(...requiredVars), async (missingVar) => {
        // Set all required variables except the one we're testing
        process.env.REPLICATE_API_TOKEN = 'test-token'
        process.env.OPENAI_API_KEY = 'test-key'
        process.env.GUMROAD_PRODUCT_PERMALINK = 'test-product'

        // Remove the variable we're testing
        delete process.env[missingVar]

        // Attempt to import config should throw
        await expect(async () => {
          await import('./config')
        }).rejects.toThrow(
          `Missing required environment variable: ${missingVar}`
        )

        // Reset modules for next iteration
        vi.resetModules()
      }),
      { numRuns: 100 }
    )
  })

  it('should provide clear error message format', async () => {
    // Clear all required variables
    delete process.env.REPLICATE_API_TOKEN
    delete process.env.OPENAI_API_KEY
    delete process.env.GUMROAD_PRODUCT_PERMALINK

    // Try to import and verify error message format
    try {
      await import('./config')
      // Should not reach here
      expect.fail('Expected config import to throw an error')
    } catch (error) {
      // Verify error message is clear and user-friendly
      expect(error).toBeInstanceOf(Error)
      expect((error as Error).message).toMatch(
        /Missing required environment variable:/
      )
      expect((error as Error).message).toMatch(
        /REPLICATE_API_TOKEN|OPENAI_API_KEY|GUMROAD_PRODUCT_PERMALINK/
      )
    }
  })

  it('should allow optional environment variables to be missing', async () => {
    // Set only required variables
    process.env.REPLICATE_API_TOKEN = 'test-token'
    process.env.OPENAI_API_KEY = 'test-key'
    process.env.GUMROAD_PRODUCT_PERMALINK = 'test-product'

    // Clear optional variables
    delete process.env.GUMROAD_ACCESS_TOKEN
    delete process.env.NODE_ENV
    delete process.env.PORT
    delete process.env.REPLICATE_BLIP_MODEL
    delete process.env.REPLICATE_REMBG_MODEL
    delete process.env.OPENAI_MODEL
    delete process.env.OPENAI_TEMPERATURE
    delete process.env.CORS_ORIGIN

    // Should not throw
    const { config } = await import('./config')

    // Verify config is created successfully
    expect(config).toBeDefined()
    expect(config.replicate.apiToken).toBe('test-token')
    expect(config.openai.apiKey).toBe('test-key')
    expect(config.gumroad.productPermalink).toBe('test-product')
  })
})
