/**
 * Custom error classes for better error handling
 * Distinguishes between operational errors (user errors) and programming errors
 */

/**
 * Additional error metadata for taxonomy
 */
export interface ErrorMetadata {
  retryable?: boolean
  service?: string
  endpoint?: string
  timestamp?: Date
  requestId?: string
  details?: Record<string, any>
  correlationId?: string
  userId?: string
  workspaceId?: string
  rateLimitInfo?: {
    limit: number
    resetTime: Date
    remaining: number
  }
}

/**
 * Base application error class
 */
export class AppError extends Error {
  public readonly statusCode: number
  public readonly isOperational: boolean
  public readonly errorCode?: string
  public readonly metadata?: ErrorMetadata

  constructor(
    statusCode: number,
    message: string,
    isOperational: boolean = true,
    errorCode?: string,
    metadata?: ErrorMetadata
  ) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = isOperational
    this.errorCode = errorCode
    this.metadata = metadata

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor)
  }
}

/**
 * Validation error (400 Bad Request)
 * Used for invalid user input
 */
export class ValidationError extends AppError {
  constructor(message: string, metadata?: ErrorMetadata) {
    super(400, message, true, 'VALIDATION_ERROR', metadata)
  }
}

/**
 * External API error (502 Bad Gateway)
 * Used when external services (Replicate, OpenAI) fail
 */
export class ExternalAPIError extends AppError {
  constructor(
    message: string,
    public readonly service: string,
    metadata?: ErrorMetadata
  ) {
    // Create metadata with service information
    const enhancedMetadata = {
      ...metadata,
      service,
      retryable: true,
    }
    // Keep the message concise for API responses; expose service separately when needed
    super(502, message, true, 'EXTERNAL_API_ERROR', enhancedMetadata)
  }
}

/**
 * Rate limit error (429 Too Many Requests)
 * Used when rate limits are exceeded
 */
export class RateLimitError extends AppError {
  constructor(
    message: string = 'Too many requests, please try again later',
    metadata?: ErrorMetadata
  ) {
    super(429, message, true, 'RATE_LIMIT_ERROR', metadata)
  }
}

/**
 * Not found error (404 Not Found)
 * Used when requested resource doesn't exist
 */
export class NotFoundError extends AppError {
  constructor(
    message: string = 'Resource not found',
    metadata?: ErrorMetadata
  ) {
    super(404, message, true, 'NOT_FOUND_ERROR', metadata)
  }
}

/**
 * Internal server error (500 Internal Server Error)
 * Used for unexpected programming errors
 */
export class InternalServerError extends AppError {
  constructor(
    message: string = 'Internal server error',
    metadata?: ErrorMetadata
  ) {
    super(500, message, false, 'INTERNAL_SERVER_ERROR', metadata)
  }
}

/**
 * Prompt injection error (400 Bad Request)
 * Used when prompts contain malicious content
 */
export class PromptInjectionError extends AppError {
  constructor(
    message: string = 'Prompt rejected for security reasons',
    metadata?: ErrorMetadata
  ) {
    super(400, message, true, 'PROMPT_INJECTION_ERROR', metadata)
  }
}

/**
 * Unauthorized access error (403 Forbidden)
 * Used when user doesn't have permission
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Access denied', metadata?: ErrorMetadata) {
    super(403, message, true, 'UNAUTHORIZED_ERROR', metadata)
  }
}

/**
 * Service unavailable error (503 Service Unavailable)
 * Used when service is temporarily down
 */
export class ServiceUnavailableError extends AppError {
  constructor(
    message: string = 'Service temporarily unavailable',
    metadata?: ErrorMetadata
  ) {
    super(503, message, true, 'SERVICE_UNAVAILABLE_ERROR', {
      ...metadata,
      retryable: true,
    })
  }
}
