/**
 * ErrorManager - Enhanced error handling system
 * Requirements: 1.1, 3.1, 3.2, 3.3, 3.4
 * 
 * Provides centralized error management with:
 * - Error context tracking (operation ID, timestamp, retry count)
 * - Specific, actionable error messages
 * - Retry eligibility checking
 * - Recovery action generation
 * - Error logging for debugging
 */

export interface ErrorContext {
  operationId: string
  timestamp: Date
  retryCount: number
  operation: string
  details?: Record<string, any>
}

export interface ErrorInfo {
  type: ErrorType
  message: string
  userMessage: string
  isRetryable: boolean
  recoveryActions: RecoveryAction[]
  context: ErrorContext
  originalError?: Error
}

export type ErrorType =
  | 'network'
  | 'api_rate_limit'
  | 'api_error'
  | 'timeout'
  | 'validation'
  | 'not_found'
  | 'unauthorized'
  | 'unknown'

export interface RecoveryAction {
  label: string
  action: () => void | Promise<void>
  isPrimary?: boolean
}

export class ErrorManager {
  private static instance: ErrorManager
  private errorLog: ErrorInfo[] = []
  private readonly MAX_LOG_SIZE = 100
  private readonly MAX_RETRIES = 3

  private constructor() {}

  static getInstance(): ErrorManager {
    if (!ErrorManager.instance) {
      ErrorManager.instance = new ErrorManager()
    }
    return ErrorManager.instance
  }

  /**
   * Process an error and generate ErrorInfo with context
   */
  processError(
    error: Error | unknown,
    operation: string,
    context?: Partial<ErrorContext>
  ): ErrorInfo {
    const errorContext: ErrorContext = {
      operationId: context?.operationId || this.generateOperationId(),
      timestamp: new Date(),
      retryCount: context?.retryCount || 0,
      operation,
      details: context?.details,
    }

    const errorType = this.detectErrorType(error)
    const userMessage = this.generateUserMessage(errorType, operation, error)
    const isRetryable = this.isRetryEligible(errorType, errorContext.retryCount)
    const recoveryActions = this.generateRecoveryActions(
      errorType,
      operation,
      errorContext,
      error
    )

    const errorInfo: ErrorInfo = {
      type: errorType,
      message: error instanceof Error ? error.message : String(error),
      userMessage,
      isRetryable,
      recoveryActions,
      context: errorContext,
      originalError: error instanceof Error ? error : undefined,
    }

    // Log error for debugging
    this.logError(errorInfo)

    return errorInfo
  }

  /**
   * Detect error type from error object
   * Requirements: 1.5, 1.6
   */
  private detectErrorType(error: unknown): ErrorType {
    if (!navigator.onLine) {
      return 'network'
    }

    if (error instanceof Error) {
      const message = error.message.toLowerCase()

      // Check for timeout
      if (message.includes('timeout') || message.includes('timed out')) {
        return 'timeout'
      }

      // Check for network errors
      if (
        message.includes('network') ||
        message.includes('fetch') ||
        message.includes('connection')
      ) {
        return 'network'
      }

      // Check for validation errors
      if (message.includes('validation') || message.includes('invalid')) {
        return 'validation'
      }

      // Check for not found
      if (message.includes('not found') || message.includes('404')) {
        return 'not_found'
      }

      // Check for unauthorized
      if (message.includes('unauthorized') || message.includes('401')) {
        return 'unauthorized'
      }
    }

    // Check for HTTP response errors
    if (typeof error === 'object' && error !== null) {
      const err = error as any
      
      if (err.status === 429 || err.statusCode === 429) {
        return 'api_rate_limit'
      }

      if (err.status === 404 || err.statusCode === 404) {
        return 'not_found'
      }

      if (err.status === 401 || err.statusCode === 401) {
        return 'unauthorized'
      }

      if (err.status >= 400 && err.status < 500) {
        return 'api_error'
      }

      if (err.status >= 500) {
        return 'api_error'
      }
    }

    return 'unknown'
  }

  /**
   * Generate user-friendly, actionable error message
   * Requirements: 1.1, 3.1
   */
  private generateUserMessage(
    type: ErrorType,
    operation: string,
    error: unknown
  ): string {
    const operationName = this.formatOperationName(operation)

    switch (type) {
      case 'network':
        return `Unable to ${operationName} due to network issues. Please check your internet connection and try again.`

      case 'api_rate_limit':
        return `Too many requests. Please wait a moment before trying to ${operationName} again.`

      case 'timeout':
        return `${operationName} took too long to complete. This might be due to a slow connection or server issues. Please try again.`

      case 'validation':
        const validationMsg = error instanceof Error ? error.message : ''
        return `Unable to ${operationName}: ${validationMsg || 'Please check your input and try again.'}`

      case 'not_found':
        return `The requested resource was not found. It may have been deleted or moved.`

      case 'unauthorized':
        return `You don't have permission to ${operationName}. Please log in and try again.`

      case 'api_error':
        return `An error occurred while trying to ${operationName}. Our team has been notified. Please try again later.`

      case 'unknown':
      default:
        return `An unexpected error occurred while trying to ${operationName}. Please try again.`
    }
  }

  /**
   * Check if error is eligible for retry
   * Requirements: 1.2, 3.3
   */
  private isRetryEligible(type: ErrorType, retryCount: number): boolean {
    if (retryCount >= this.MAX_RETRIES) {
      return false
    }

    // Retryable error types
    const retryableTypes: ErrorType[] = [
      'network',
      'api_rate_limit',
      'timeout',
      'api_error',
    ]

    return retryableTypes.includes(type)
  }

  /**
   * Generate recovery actions based on error type
   * Requirements: 3.2, 3.3, 3.4
   */
  private generateRecoveryActions(
    type: ErrorType,
    operation: string,
    context: ErrorContext,
    error: unknown
  ): RecoveryAction[] {
    const actions: RecoveryAction[] = []

    // Add retry action for retryable errors
    if (this.isRetryEligible(type, context.retryCount)) {
      actions.push({
        label: 'Retry',
        action: () => {
          // Retry will be handled by the caller
          console.log(`Retry action for ${operation}`)
        },
        isPrimary: true,
      })
    }

    // Add type-specific recovery actions
    switch (type) {
      case 'network':
        actions.push({
          label: 'Check Connection',
          action: () => {
            window.open('https://www.google.com', '_blank')
          },
        })
        break

      case 'api_rate_limit':
        actions.push({
          label: 'Wait and Retry',
          action: async () => {
            await new Promise((resolve) => setTimeout(resolve, 5000))
            console.log(`Delayed retry for ${operation}`)
          },
          isPrimary: true,
        })
        break

      case 'unauthorized':
        actions.push({
          label: 'Log In',
          action: () => {
            window.location.href = '/login'
          },
          isPrimary: true,
        })
        break

      case 'not_found':
        actions.push({
          label: 'Go Back',
          action: () => {
            window.history.back()
          },
        })
        break

      case 'validation':
        // No automatic recovery for validation errors
        break

      case 'timeout':
      case 'api_error':
      case 'unknown':
        if (!this.isRetryEligible(type, context.retryCount)) {
          // Suggest alternatives when retry is not available
          actions.push({
            label: 'Contact Support',
            action: () => {
              window.open('mailto:support@captionart.com', '_blank')
            },
          })
        }
        break
    }

    return actions
  }

  /**
   * Log error for debugging
   */
  private logError(errorInfo: ErrorInfo): void {
    // Add to error log
    this.errorLog.push(errorInfo)

    // Trim log if too large
    if (this.errorLog.length > this.MAX_LOG_SIZE) {
      this.errorLog = this.errorLog.slice(-this.MAX_LOG_SIZE)
    }

    // Console log for development
    console.error('[ErrorManager]', {
      type: errorInfo.type,
      operation: errorInfo.context.operation,
      message: errorInfo.message,
      userMessage: errorInfo.userMessage,
      retryCount: errorInfo.context.retryCount,
      timestamp: errorInfo.context.timestamp,
      originalError: errorInfo.originalError,
    })
  }

  /**
   * Get error log for debugging
   */
  getErrorLog(): ErrorInfo[] {
    return [...this.errorLog]
  }

  /**
   * Clear error log
   */
  clearErrorLog(): void {
    this.errorLog = []
  }

  /**
   * Generate unique operation ID
   */
  private generateOperationId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Format operation name for user messages
   */
  private formatOperationName(operation: string): string {
    // Convert camelCase or snake_case to readable format
    return operation
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .toLowerCase()
      .trim()
  }
}

// Export singleton instance
export const errorManager = ErrorManager.getInstance()
