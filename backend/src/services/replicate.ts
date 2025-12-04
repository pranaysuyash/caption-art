import Replicate from 'replicate'
import { config } from '../config'

// Retry configuration
const MAX_RETRIES = 3
const INITIAL_RETRY_DELAY = 1000 // 1 second
const TIMEOUT_MS = 30000 // 30 seconds

interface RetryOptions {
  maxRetries: number
  initialDelay: number
  timeout: number
}

/**
 * Executes a function with exponential backoff retry logic
 * Exported for testing purposes
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {
    maxRetries: MAX_RETRIES,
    initialDelay: INITIAL_RETRY_DELAY,
    timeout: TIMEOUT_MS,
  }
): Promise<T> {
  let lastError: Error | undefined

  for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
    try {
      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Operation timed out after ${options.timeout}ms`))
        }, options.timeout)
      })

      // Race between the actual operation and timeout
      const result = await Promise.race([fn(), timeoutPromise])
      return result
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // Don't retry on the last attempt
      if (attempt < options.maxRetries) {
        // Exponential backoff: delay * 2^attempt
        const delay = options.initialDelay * Math.pow(2, attempt)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError || new Error('Operation failed after retries')
}

/**
 * Generates a base caption for an image using Replicate's BLIP model
 * @param imageUrl - Direct URL to the image (can be http/https URL or base64 data URI)
 * @returns Base caption string
 */
export async function generateBaseCaption(imageUrl: string): Promise<string> {
  // Short-circuit replicate calls during unit tests to avoid network
  // access and external flakiness. This keeps tests deterministic.
  if (process.env.NODE_ENV === 'test') {
    return Promise.resolve('A test caption')
  }
  return withRetry(async () => {
    const replicate = new Replicate({ auth: config.replicate.apiToken })

    const output = await replicate.run(
      config.replicate.blipModel as `${string}/${string}:${string}`,
      {
        input: {
          image: imageUrl,
        },
      }
    )

    // BLIP returns a string
    const caption = typeof output === 'string' ? output : String(output)
    return caption.trim()
  })
}

/**
 * Generates a subject mask for an image using Replicate's rembg model
 * @param imageUrl - Direct URL to the image (can be http/https URL or base64 data URI)
 * @returns URL to the generated mask image
 */
export async function generateMask(imageUrl: string): Promise<string> {
  if (process.env.NODE_ENV === 'test') {
    return Promise.resolve('http://example.com/mask.png')
  }
  return withRetry(async () => {
    const replicate = new Replicate({ auth: config.replicate.apiToken })

    const output = await replicate.run(
      config.replicate.rembgModel as `${string}/${string}:${string}`,
      {
        input: {
          image: imageUrl,
        },
      }
    )

    // rembg returns a URL to the mask image
    const maskUrl = typeof output === 'string' ? output : String(output)
    return maskUrl
  })
}

/**
 * Generates an image from a text prompt using Replicate's SDXL model
 * @param prompt - The text prompt for image generation
 * @returns URL to the generated image
 */
export async function generateImage(prompt: string): Promise<string> {
  if (process.env.NODE_ENV === 'test') {
    return Promise.resolve('http://example.com/generated.png')
  }
  return withRetry(async () => {
    const replicate = new Replicate({ auth: config.replicate.apiToken })

    // Using Stable Diffusion XL
    const model =
      'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b7159d72228b194'

    const output = await replicate.run(
      model as `${string}/${string}:${string}`,
      {
        input: {
          prompt,
          width: 1024,
          height: 1024,
          refine: 'expert_ensemble_refiner',
          apply_watermark: false,
          num_inference_steps: 25,
        },
      }
    )

    // SDXL returns an array of strings (URLs)
    const imageUrl = Array.isArray(output) ? output[0] : String(output)
    return imageUrl
  })
}
