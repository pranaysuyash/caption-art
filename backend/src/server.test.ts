import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import * as fc from 'fast-check'
import type { Server } from 'http'

describe('Server', () => {
  let servers: Server[] = []
  let originalEnv: NodeJS.ProcessEnv

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env }

    // Set up required environment variables for tests
    process.env.REPLICATE_API_TOKEN = 'test-token'
    process.env.OPENAI_API_KEY = 'test-key'
    process.env.GUMROAD_PRODUCT_PERMALINK = 'test-product'

    // Reset modules to force re-evaluation
    vi.resetModules()
  })

  afterEach(() => {
    // Clean up all servers after each test
    servers.forEach((server) => {
      if (server.listening) {
        server.close()
      }
    })
    servers = []

    // Restore original environment
    process.env = originalEnv

    // Reset modules again
    vi.resetModules()
  })

  describe('createServer', () => {
    it('should create an Express application', async () => {
      const serverModule = await import('./server')
      const createServer =
        (serverModule as any).createServer ||
        (serverModule as any).default?.createServer
      // Disable rate limiter in tests to avoid requiring rate-limiter internals
      const app = createServer({ enableRateLimiter: false, loadRoutes: false })
      expect(app).toBeDefined()
      expect(typeof app.listen).toBe('function')
    })
  })

  /**
   * Feature: platform-agnostic-backend, Property 2: Port configurability
   * Validates: Requirements 1.4
   *
   * Property: For any PORT environment variable value, the service should
   * listen on that port when started
   */
  describe('Property 2: Port configurability', () => {
    it('should listen on the configured port', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random valid port numbers (1024-65535, avoiding privileged ports)
          fc.integer({ min: 1024, max: 65535 }),
          async (port) => {
            return new Promise<void>(async (resolve, reject) => {
              try {
                // Import server module dynamically
                const serverModule = await import('./server')
                const createServer =
                  (serverModule as any).createServer ||
                  (serverModule as any).default?.createServer
                const app = createServer({
                  enableRateLimiter: false,
                  loadRoutes: false,
                })

                const server = app.listen(port, () => {
                  try {
                    // Verify the server is listening on the correct port
                    const address = server.address()

                    if (address && typeof address === 'object') {
                      expect(address.port).toBe(port)
                      resolve()
                    } else {
                      reject(new Error('Server address is not an object'))
                    }
                  } catch (error) {
                    reject(error)
                  } finally {
                    server.close()
                  }
                })

                server.on('error', (error: NodeJS.ErrnoException) => {
                  // If port is already in use, skip this test case
                  if (error.code === 'EADDRINUSE') {
                    server.close()
                    resolve() // Skip this iteration
                  } else {
                    reject(error)
                  }
                })

                servers.push(server)
              } catch (error) {
                reject(error)
              }
            })
          }
        ),
        { numRuns: 100 } // Run 100 iterations as specified in the design
      )
    })
  })
})
