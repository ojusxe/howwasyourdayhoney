import { ErrorType, APIError } from './types';

/**
 * Centralized error handling system
 */
export class ErrorHandler {
  /**
   * Create a standardized API error
   */
  static createError(
    type: ErrorType,
    message: string,
    details?: any,
    originalError?: Error
  ): APIError {
    return {
      type,
      message,
      details: details || (originalError ? {
        name: originalError.name,
        message: originalError.message,
        stack: process.env.NODE_ENV === 'development' ? originalError.stack : undefined
      } : undefined),
      timestamp: new Date()
    };
  }

  /**
   * Handle validation errors
   */
  static handleValidationError(error: any): APIError {
    if (error instanceof ValidationError) {
      return this.createError(ErrorType.VALIDATION_ERROR, error.message, error.details);
    }
    
    return this.createError(
      ErrorType.VALIDATION_ERROR,
      'Validation failed',
      undefined,
      error instanceof Error ? error : undefined
    );
  }

  /**
   * Handle processing errors
   */
  static handleProcessingError(error: any): APIError {
    if (error instanceof ProcessingError) {
      return this.createError(ErrorType.PROCESSING_ERROR, error.message, error.details);
    }

    // Check for specific error types
    if (error instanceof Error) {
      if (error.message.includes('timeout') || error.message.includes('TIMEOUT')) {
        return this.createError(ErrorType.TIMEOUT_ERROR, 'Processing timeout', undefined, error);
      }
      
      if (error.message.includes('memory') || error.message.includes('ENOMEM')) {
        return this.createError(ErrorType.MEMORY_ERROR, 'Insufficient memory', undefined, error);
      }
      
      if (error.message.includes('format') || error.message.includes('codec')) {
        return this.createError(ErrorType.FORMAT_ERROR, 'Invalid video format', undefined, error);
      }
    }

    return this.createError(
      ErrorType.PROCESSING_ERROR,
      'Processing failed',
      undefined,
      error instanceof Error ? error : undefined
    );
  }

  /**
   * Handle timeout errors
   */
  static handleTimeoutError(jobId: string, timeoutMs: number): APIError {
    return this.createError(
      ErrorType.TIMEOUT_ERROR,
      `Processing timeout after ${timeoutMs / 1000} seconds`,
      { jobId, timeoutMs }
    );
  }

  /**
   * Handle memory errors
   */
  static handleMemoryError(memoryUsage?: number): APIError {
    return this.createError(
      ErrorType.MEMORY_ERROR,
      'Insufficient memory for processing',
      { memoryUsage }
    );
  }

  /**
   * Handle format errors
   */
  static handleFormatError(format: string, supportedFormats: string[]): APIError {
    return this.createError(
      ErrorType.FORMAT_ERROR,
      `Unsupported format: ${format}`,
      { format, supportedFormats }
    );
  }

  /**
   * Log error for monitoring
   */
  static logError(error: APIError, context?: any): void {
    const logData = {
      type: error.type,
      message: error.message,
      timestamp: error.timestamp,
      details: error.details,
      context
    };

    // In production, this would send to monitoring service
    console.error('[ERROR]', JSON.stringify(logData, null, 2));
  }

  /**
   * Determine if error is retryable
   */
  static isRetryable(error: APIError): boolean {
    switch (error.type) {
      case ErrorType.TIMEOUT_ERROR:
      case ErrorType.PROCESSING_ERROR:
        return true;
      case ErrorType.MEMORY_ERROR:
        return false; // Usually requires different settings
      case ErrorType.VALIDATION_ERROR:
      case ErrorType.FORMAT_ERROR:
        return false; // User needs to fix input
      default:
        return false;
    }
  }

  /**
   * Get user-friendly error message
   */
  static getUserMessage(error: APIError): string {
    switch (error.type) {
      case ErrorType.VALIDATION_ERROR:
        return error.message;
      case ErrorType.PROCESSING_ERROR:
        return 'Processing failed. Please try again or use different settings.';
      case ErrorType.TIMEOUT_ERROR:
        return 'Processing took too long. Try a shorter video or lower quality settings.';
      case ErrorType.MEMORY_ERROR:
        return 'Not enough memory to process this video. Try reducing the resolution scale or frame rate.';
      case ErrorType.FORMAT_ERROR:
        return 'Video format not supported. Please use MP4 or WebM format.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  /**
   * Get suggested actions for error
   */
  static getSuggestions(error: APIError): string[] {
    switch (error.type) {
      case ErrorType.VALIDATION_ERROR:
        return [
          'Check that your video meets the requirements',
          'Ensure file size is under 25MB',
          'Verify video duration is under 15 seconds',
          'Use MP4 or WebM format'
        ];
      case ErrorType.PROCESSING_ERROR:
        return [
          'Try uploading a different video',
          'Reduce resolution scale to 75% or 50%',
          'Use 12 FPS instead of 24 FPS',
          'Check your internet connection'
        ];
      case ErrorType.TIMEOUT_ERROR:
        return [
          'Use a shorter video (under 10 seconds)',
          'Reduce resolution scale to 50%',
          'Use 12 FPS frame rate',
          'Try a simpler video with less motion'
        ];
      case ErrorType.MEMORY_ERROR:
        return [
          'Reduce resolution scale to 50%',
          'Use 12 FPS frame rate',
          'Upload a shorter video',
          'Close other browser tabs',
          'Try refreshing the page'
        ];
      case ErrorType.FORMAT_ERROR:
        return [
          'Convert video to MP4 or WebM format',
          'Ensure video file is not corrupted',
          'Try a different video file',
          'Check video codec compatibility'
        ];
      default:
        return ['Please try again or contact support'];
    }
  }
}

/**
 * Client-side error recovery system
 */
export class ErrorRecovery {
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAYS = [1000, 2000, 4000]; // Exponential backoff

  /**
   * Determine if error should be retried
   */
  static shouldRetry(error: APIError, attemptCount: number): boolean {
    if (attemptCount >= this.MAX_RETRIES) {
      return false;
    }

    return ErrorHandler.isRetryable(error);
  }

  /**
   * Get retry delay for attempt
   */
  static getRetryDelay(attemptCount: number): number {
    return this.RETRY_DELAYS[Math.min(attemptCount, this.RETRY_DELAYS.length - 1)];
  }

  /**
   * Get maximum retries for error type
   */
  static getMaxRetries(errorType: ErrorType): number {
    switch (errorType) {
      case ErrorType.TIMEOUT_ERROR:
        return 2; // Fewer retries for timeouts
      case ErrorType.PROCESSING_ERROR:
        return 3;
      default:
        return 0; // No retries for validation/format errors
    }
  }

  /**
   * Execute operation with retry logic
   */
  static async withRetry<T>(
    operation: () => Promise<T>,
    errorHandler: (error: any) => APIError,
    maxRetries: number = this.MAX_RETRIES
  ): Promise<T> {
    let lastError: APIError | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = errorHandler(error);
        
        if (attempt === maxRetries || !this.shouldRetry(lastError, attempt)) {
          throw lastError;
        }

        // Wait before retry
        const delay = this.getRetryDelay(attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        console.log(`Retrying operation (attempt ${attempt + 1}/${maxRetries}) after ${delay}ms`);
      }
    }

    throw lastError;
  }
}

/**
 * Custom error classes
 */
export class ValidationError extends Error {
  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class ProcessingError extends Error {
  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'ProcessingError';
  }
}

export class TimeoutError extends Error {
  constructor(message: string, public timeoutMs: number) {
    super(message);
    this.name = 'TimeoutError';
  }
}

export class MemoryError extends Error {
  constructor(message: string, public memoryUsage?: number) {
    super(message);
    this.name = 'MemoryError';
  }
}

export class FormatError extends Error {
  constructor(message: string, public format?: string) {
    super(message);
    this.name = 'FormatError';
  }
}

/**
 * Global error boundary for unhandled errors
 */
export class GlobalErrorHandler {
  private static instance: GlobalErrorHandler | null = null;
  private errorListeners: ((error: APIError) => void)[] = [];

  static getInstance(): GlobalErrorHandler {
    if (!this.instance) {
      this.instance = new GlobalErrorHandler();
    }
    return this.instance;
  }

  /**
   * Initialize global error handling
   */
  init(): void {
    // Handle unhandled promise rejections
    if (typeof window !== 'undefined') {
      window.addEventListener('unhandledrejection', (event) => {
        const error = ErrorHandler.handleProcessingError(event.reason);
        this.notifyListeners(error);
        ErrorHandler.logError(error, { type: 'unhandledrejection' });
      });

      // Handle JavaScript errors
      window.addEventListener('error', (event) => {
        const error = ErrorHandler.handleProcessingError(event.error);
        this.notifyListeners(error);
        ErrorHandler.logError(error, { type: 'javascript_error' });
      });
    }
  }

  /**
   * Add error listener
   */
  addErrorListener(listener: (error: APIError) => void): void {
    this.errorListeners.push(listener);
  }

  /**
   * Remove error listener
   */
  removeErrorListener(listener: (error: APIError) => void): void {
    const index = this.errorListeners.indexOf(listener);
    if (index > -1) {
      this.errorListeners.splice(index, 1);
    }
  }

  /**
   * Notify all error listeners
   */
  private notifyListeners(error: APIError): void {
    this.errorListeners.forEach(listener => {
      try {
        listener(error);
      } catch (err) {
        console.error('Error in error listener:', err);
      }
    });
  }
}