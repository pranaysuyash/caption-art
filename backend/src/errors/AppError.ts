/**
 * Custom error classes for better error handling
 * Distinguishes between operational errors (user errors) and programming errors
 */

/**
 * Base application error class
 */
export class AppError extends Error {
  public readonly statusCode: number
  public readonly isOperational: boolean

  constructor(
    statusCode: number,
    message: string,
    isOperational: boolean = true
  ) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = isOperational

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor)
  }
}

/**
 * Validation error (400 Bad Request)
 * Used for invalid user input
 */
export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, message, true)
  }
}

/**
 * External API error (502 Bad Gateway)
 * Used when external services (Replicate, OpenAI) fail
 */
export class ExternalAPIError extends AppError {
  constructor(
    message: string,
    public readonly service: string
  ) {
    // Keep the message concise for API responses; expose service separately when needed
    super(502, message, true)
  }
}

/**
 * Rate limit error (429 Too Many Requests)
 * Used when rate limits are exceeded
 */
export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests, please try again later') {
    super(429, message, true)
  }
}

/**
 * Not found error (404 Not Found)
 * Used when requested resource doesn't exist
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(404, message, true)
  }
}

/**
 * Internal server error (500 Internal Server Error)
 * Used for unexpected programming errors
 */
export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error') {
    super(500, message, false)
  }
}
