/**
 * Error handling utilities for consistent error UI and retry logic
 */

export enum ErrorType {
  Network = 'network',
  Server = 'server',
  Timeout = 'timeout',
  Authentication = 'authentication',
  Permission = 'permission',
  NotFound = 'not_found',
  Unknown = 'unknown',
}

export interface AppError {
  type: ErrorType;
  message: string;
  originalError?: Error;
  retryable: boolean;
}

/**
 * Parse error and return structured error information
 */
export const parseError = (error: any): AppError => {
  // Network errors
  if (error?.message?.includes('Network') || error?.message?.includes('fetch')) {
    return {
      type: ErrorType.Network,
      message: 'No internet connection. Please check your network and try again.',
      originalError: error,
      retryable: true,
    };
  }

  // Timeout errors
  if (error?.message?.includes('timeout') || error?.message?.includes('Timeout')) {
    return {
      type: ErrorType.Timeout,
      message: 'Request timed out. Please try again.',
      originalError: error,
      retryable: true,
    };
  }

  // Authentication errors
  if (error?.status === 401 || error?.message?.includes('Unauthorized')) {
    return {
      type: ErrorType.Authentication,
      message: 'Your session has expired. Please sign in again.',
      originalError: error,
      retryable: false,
    };
  }

  // Permission errors
  if (error?.status === 403 || error?.message?.includes('Forbidden')) {
    return {
      type: ErrorType.Permission,
      message: 'You do not have permission to perform this action.',
      originalError: error,
      retryable: false,
    };
  }

  // Not found errors
  if (error?.status === 404) {
    return {
      type: ErrorType.NotFound,
      message: 'The requested resource was not found.',
      originalError: error,
      retryable: false,
    };
  }

  // Server errors
  if (error?.status >= 500) {
    return {
      type: ErrorType.Server,
      message: 'Server error. Please try again later.',
      originalError: error,
      retryable: true,
    };
  }

  // Default unknown error
  return {
    type: ErrorType.Unknown,
    message: error?.message || 'Something went wrong. Please try again.',
    originalError: error,
    retryable: true,
  };
};

/**
 * Retry function with exponential backoff
 */
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> => {
  let lastError: Error | undefined;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
};
