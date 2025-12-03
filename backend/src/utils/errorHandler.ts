/**
 * Enhanced error handling utilities for structured error taxonomy
 */

import { AppError, ValidationError, ExternalAPIError, RateLimitError, NotFoundError, InternalServerError, PromptInjectionError, UnauthorizedError, ServiceUnavailableError } from '../errors/AppError';
import { log } from '../middleware/logger';
import { Request } from 'express';

// Enhanced error context for better taxonomy
export interface ErrorContext {
  userId?: string;
  workspaceId?: string;
  requestId?: string;
  service?: string;
  endpoint?: string;
  details?: Record<string, any>;
  correlationId?: string;
}

/**
 * Creates a contextual error with additional metadata
 */
export function createErrorWithContext(
  error: AppError,
  context: ErrorContext = {}
): AppError {
  const enhancedMetadata = {
    ...error.metadata,
    ...context,
    timestamp: new Date(),
  };

  // Return a new instance of the same error type with enhanced metadata
  switch (error.constructor.name) {
    case 'ValidationError':
      return new ValidationError(error.message, enhancedMetadata);
    case 'ExternalAPIError':
      return new ExternalAPIError(error.message, (error as ExternalAPIError).service, enhancedMetadata);
    case 'RateLimitError':
      return new RateLimitError(error.message, enhancedMetadata);
    case 'NotFoundError':
      return new NotFoundError(error.message, enhancedMetadata);
    case 'InternalServerError':
      return new InternalServerError(error.message, enhancedMetadata);
    case 'PromptInjectionError':
      return new PromptInjectionError(error.message, enhancedMetadata);
    case 'UnauthorizedError':
      return new UnauthorizedError(error.message, enhancedMetadata);
    case 'ServiceUnavailableError':
      return new ServiceUnavailableError(error.message, enhancedMetadata);
    default:
      return new AppError(
        error.statusCode,
        error.message,
        error.isOperational,
        error.errorCode,
        enhancedMetadata
      );
  }
}

/**
 * Logs an error with enhanced context
 */
export function logError(
  error: Error | AppError,
  context: ErrorContext = {},
  additionalFields: Record<string, any> = {}
) {
  const errorLog = {
    ...additionalFields,
    error: {
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      ...(error instanceof AppError && {
        statusCode: error.statusCode,
        errorCode: error.errorCode,
        isOperational: error.isOperational,
        metadata: error.metadata,
      }),
    },
    context,
  };

  log.error(errorLog, 'Enhanced error logging');
}

/**
 * Safely sanitizes error objects to prevent leakage of sensitive information
 */
export function sanitizeError(error: any): any {
  const sanitizedError: any = {
    name: error.name,
    message: error.message,
    statusCode: error.statusCode,
  };

  // Add additional fields if they exist but don't add sensitive ones
  if (error.errorCode) sanitizedError.errorCode = error.errorCode;
  if (error.isOperational) sanitizedError.isOperational = error.isOperational;
  if (error.metadata) {
    const { userId, workspaceId, requestId, ...safeMetadata } = error.metadata;
    sanitizedError.metadata = safeMetadata;
  }

  return sanitizedError;
}

/**
 * Wraps a function with enhanced error handling
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  context: ErrorContext = {}
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    logError(error, context);
    throw error;
  }
}

/**
 * Creates an error response object with structured format
 */
export function errorResponse(
  error: Error | AppError,
  includeStack: boolean = false
) {
  const response: any = {
    error: error.message,
    timestamp: new Date().toISOString(),
  };

  if (error instanceof AppError) {
    response.errorCode = error.errorCode;
    if (error.metadata) {
      response.metadata = error.metadata;
    }
    if (error.statusCode) {
      response.statusCode = error.statusCode;
    }
  }

  if (includeStack && process.env.NODE_ENV === 'development') {
    response.stack = error.stack;
  }

  return response;
}

/**
 * Checks if an error is retryable based on error type and metadata
 */
export function isRetryableError(error: Error | AppError): boolean {
  // If it's an AppError with retryable metadata, return that
  if (error instanceof AppError && error.metadata?.retryable !== undefined) {
    return error.metadata.retryable;
  }

  // Default retryable logic based on error type
  if (error instanceof ExternalAPIError) {
    return true; // External service errors are typically retryable
  }
  if (error instanceof ServiceUnavailableError) {
    return true; // Service unavailability is typically retryable
  }
  if (error.name === 'NetworkError' || error.message.includes('timeout')) {
    return true; // Network errors are often retryable
  }

  return false;
}

/**
 * Enriches an error with additional request context
 */
export function enrichErrorWithContext(error: AppError, req?: Request) {
  const enrichedMetadata = {
    ...error.metadata,
    ...(req && {
      requestId: (req as any).requestId,
      method: req.method,
      path: req.path,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
    }),
  };

  // Create a new error instance with enriched metadata
  return createErrorWithContext(error, enrichedMetadata);
}