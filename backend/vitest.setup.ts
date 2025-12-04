// Setup test environment variables
import dotenv from 'dotenv'
import { vi } from 'vitest'
// Load env from backend/.env if present - this ensures local tokens are not overwritten by tests
dotenv.config({ path: './.env' })
process.env.NODE_ENV = process.env.NODE_ENV || 'test'
process.env.PORT = process.env.PORT || '3001'
// Set fallback-only defaults so we don't overwrite locally configured tokens
process.env.REPLICATE_API_TOKEN =
  process.env.REPLICATE_API_TOKEN || 'test-replicate-token'
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'test-openai-key'
process.env.GUMROAD_PRODUCT_PERMALINK =
  process.env.GUMROAD_PRODUCT_PERMALINK || 'test-product'
process.env.CORS_ORIGIN = process.env.CORS_ORIGIN || '*'

// For test environment ensure Prisma connects to a local SQLite DB
// so tests are deterministic and do not require a Postgres instance.
process.env.DATABASE_PROVIDER = process.env.DATABASE_PROVIDER || 'sqlite'
process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'file:./app.sqlite'

// Provide global mocks for external AI/3rd-party libraries to avoid network calls during tests
// These mocks ensure deterministic responses and let tests spyOn module exports as needed.
// Mock the 'replicate' npm package that is used by replicate service.
vi.mock('replicate', () => {
  return {
    default: class MockReplicate {
      constructor(_opts?: any) {}
      async run(model: string, _opts: any) {
        // Return values depend on model type: BLIP returns string caption, rembg returns mask URL, SDXL returns array
        if (model && model.includes('blip')) {
          return 'A mock caption for testing'
        }
        if (model && model.includes('rembg')) {
          return 'http://example.com/mask.png'
        }
        // Default: return array of URLs for image generation
        return ['http://example.com/generated.png']
      }
    },
  }
})

// Additionally mock the service module by absolute path to ensure that any
// require/import resolvers that resolve via absolute paths during lazy-loading
// in createServer are intercepted in tests.
vi.mock('/Users/pranay/Projects/caption-art/backend/src/services/replicate.ts', () => {
  return {
    generateBaseCaption: vi.fn().mockResolvedValue('A mock caption for testing'),
    generateMask: vi.fn().mockResolvedValue('http://example.com/mask.png'),
    generateImage: vi.fn().mockResolvedValue('http://example.com/generated.png'),
  }
})

// Mock the 'openai' npm package used by styleAnalyzer and multiFormatService
vi.mock('openai', () => {
  return {
    default: class MockOpenAI {
      constructor(_opts: any) {}
      chat = {
        completions: {
          create: async (_opts?: any) => {
            return {
              choices: [
                {
                  message: {
                    content: JSON.stringify({
                      tone: ['casual'],
                      vocabulary: ['bright', 'fun'],
                      sentenceStructure: 'short',
                      punctuationStyle: 'light',
                      emojiUsage: 'sparingly',
                      hashtagPattern: '#example',
                      averageLength: 80,
                      uniquePatterns: [],
                    }),
                  },
                },
              ],
            }
          },
        },
      }
    },
  }
})
