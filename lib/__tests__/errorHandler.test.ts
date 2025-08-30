import { 
  ErrorHandler, 
  ErrorRecovery, 
  ValidationError, 
  ProcessingError,
  TimeoutError,
  MemoryError,
  FormatError 
} from '../errorHandler';
import { ErrorType } from '../types';

describe('ErrorHandler', () => {
  describe('createError', () => {
    it('should create a standardized API error', () => {
      const error = ErrorHandler.createError(
        ErrorType.VALIDATION_ERROR,
        'Test error',
        { field: 'test' }
      );

      expect(error.type).toBe(ErrorType.VALIDATION_ERROR);
      expect(error.message).toBe('Test error');
      expect(error.details).toEqual({ field: 'test' });
      expect(error.timestamp).toBeInstanceOf(Date);
    });

    it('should include original error details', () => {
      const originalError = new Error('Original error');
      const error = ErrorHandler.createError(
        ErrorType.PROCESSING_ERROR,
        'Wrapped error',
        undefined,
        originalError
      );

      expect(error.details).toEqual({
        name: 'Error',
        message: 'Original error',
        stack: expect.any(String)
      });
    });
  });

  describe('handleValidationError', () => {
    it('should handle ValidationError instances', () => {
      const validationError = new ValidationError('Invalid input', { field: 'email' });
      const error = ErrorHandler.handleValidationError(validationError);

      expect(error.type).toBe(ErrorType.VALIDATION_ERROR);
      expect(error.message).toBe('Invalid input');
      expect(error.details).toEqual({ field: 'email' });
    });

    it('should handle generic errors', () => {
      const genericError = new Error('Generic error');
      const error = ErrorHandler.handleValidationError(genericError);

      expect(error.type).toBe(ErrorType.VALIDATION_ERROR);
      expect(error.message).toBe('Validation failed');
    });
  });

  describe('handleProcessingError', () => {
    it('should handle ProcessingError instances', () => {
      const processingError = new ProcessingError('Processing failed', { step: 'conversion' });
      const error = ErrorHandler.handleProcessingError(processingError);

      expect(error.type).toBe(ErrorType.PROCESSING_ERROR);
      expect(error.message).toBe('Processing failed');
      expect(error.details).toEqual({ step: 'conversion' });
    });

    it('should detect timeout errors', () => {
      const timeoutError = new Error('Operation timeout');
      const error = ErrorHandler.handleProcessingError(timeoutError);

      expect(error.type).toBe(ErrorType.TIMEOUT_ERROR);
      expect(error.message).toBe('Processing timeout');
    });

    it('should detect memory errors', () => {
      const memoryError = new Error('ENOMEM: not enough memory');
      const error = ErrorHandler.handleProcessingError(memoryError);

      expect(error.type).toBe(ErrorType.MEMORY_ERROR);
      expect(error.message).toBe('Insufficient memory');
    });

    it('should detect format errors', () => {
      const formatError = new Error('Unsupported codec format');
      const error = ErrorHandler.handleProcessingError(formatError);

      expect(error.type).toBe(ErrorType.FORMAT_ERROR);
      expect(error.message).toBe('Invalid video format');
    });
  });

  describe('isRetryable', () => {
    it('should identify retryable errors', () => {
      const timeoutError = ErrorHandler.createError(ErrorType.TIMEOUT_ERROR, 'Timeout');
      const processingError = ErrorHandler.createError(ErrorType.PROCESSING_ERROR, 'Processing failed');

      expect(ErrorHandler.isRetryable(timeoutError)).toBe(true);
      expect(ErrorHandler.isRetryable(processingError)).toBe(true);
    });

    it('should identify non-retryable errors', () => {
      const validationError = ErrorHandler.createError(ErrorType.VALIDATION_ERROR, 'Invalid input');
      const formatError = ErrorHandler.createError(ErrorType.FORMAT_ERROR, 'Invalid format');
      const memoryError = ErrorHandler.createError(ErrorType.MEMORY_ERROR, 'Out of memory');

      expect(ErrorHandler.isRetryable(validationError)).toBe(false);
      expect(ErrorHandler.isRetryable(formatError)).toBe(false);
      expect(ErrorHandler.isRetryable(memoryError)).toBe(false);
    });
  });

  describe('getUserMessage', () => {
    it('should return user-friendly messages', () => {
      const validationError = ErrorHandler.createError(ErrorType.VALIDATION_ERROR, 'Field required');
      const processingError = ErrorHandler.createError(ErrorType.PROCESSING_ERROR, 'Internal error');
      const timeoutError = ErrorHandler.createError(ErrorType.TIMEOUT_ERROR, 'Timeout');

      expect(ErrorHandler.getUserMessage(validationError)).toBe('Field required');
      expect(ErrorHandler.getUserMessage(processingError)).toContain('Processing failed');
      expect(ErrorHandler.getUserMessage(timeoutError)).toContain('took too long');
    });
  });

  describe('getSuggestions', () => {
    it('should return appropriate suggestions for each error type', () => {
      const validationError = ErrorHandler.createError(ErrorType.VALIDATION_ERROR, 'Invalid');
      const memoryError = ErrorHandler.createError(ErrorType.MEMORY_ERROR, 'Out of memory');

      const validationSuggestions = ErrorHandler.getSuggestions(validationError);
      const memorySuggestions = ErrorHandler.getSuggestions(memoryError);

      expect(validationSuggestions).toContain('Check that your video meets the requirements');
      expect(memorySuggestions).toContain('Reduce resolution scale to 50%');
    });
  });
});

describe('ErrorRecovery', () => {
  describe('shouldRetry', () => {
    it('should respect max retry limit', () => {
      const retryableError = ErrorHandler.createError(ErrorType.TIMEOUT_ERROR, 'Timeout');
      
      expect(ErrorRecovery.shouldRetry(retryableError, 0)).toBe(true);
      expect(ErrorRecovery.shouldRetry(retryableError, 2)).toBe(true);
      expect(ErrorRecovery.shouldRetry(retryableError, 3)).toBe(false);
    });

    it('should not retry non-retryable errors', () => {
      const nonRetryableError = ErrorHandler.createError(ErrorType.VALIDATION_ERROR, 'Invalid');
      
      expect(ErrorRecovery.shouldRetry(nonRetryableError, 0)).toBe(false);
    });
  });

  describe('getRetryDelay', () => {
    it('should return exponential backoff delays', () => {
      expect(ErrorRecovery.getRetryDelay(0)).toBe(1000);
      expect(ErrorRecovery.getRetryDelay(1)).toBe(2000);
      expect(ErrorRecovery.getRetryDelay(2)).toBe(4000);
      expect(ErrorRecovery.getRetryDelay(10)).toBe(4000); // Max delay
    });
  });

  describe('getMaxRetries', () => {
    it('should return appropriate retry limits', () => {
      expect(ErrorRecovery.getMaxRetries(ErrorType.TIMEOUT_ERROR)).toBe(2);
      expect(ErrorRecovery.getMaxRetries(ErrorType.PROCESSING_ERROR)).toBe(3);
      expect(ErrorRecovery.getMaxRetries(ErrorType.VALIDATION_ERROR)).toBe(0);
    });
  });

  describe('withRetry', () => {
    it('should succeed on first attempt', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      const errorHandler = jest.fn();

      const result = await ErrorRecovery.withRetry(operation, errorHandler);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
      expect(errorHandler).not.toHaveBeenCalled();
    });

    it('should retry on retryable errors', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('timeout'))
        .mockResolvedValue('success');
      
      const errorHandler = jest.fn().mockReturnValue(
        ErrorHandler.createError(ErrorType.TIMEOUT_ERROR, 'Timeout')
      );

      const result = await ErrorRecovery.withRetry(operation, errorHandler, 2);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should not retry non-retryable errors', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('validation'));
      const errorHandler = jest.fn().mockReturnValue(
        ErrorHandler.createError(ErrorType.VALIDATION_ERROR, 'Invalid')
      );

      await expect(ErrorRecovery.withRetry(operation, errorHandler)).rejects.toThrow();
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should throw after max retries', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('timeout'));
      const errorHandler = jest.fn().mockReturnValue(
        ErrorHandler.createError(ErrorType.TIMEOUT_ERROR, 'Timeout')
      );

      await expect(ErrorRecovery.withRetry(operation, errorHandler, 2)).rejects.toThrow();
      expect(operation).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
  });
});

describe('Custom Error Classes', () => {
  it('should create ValidationError with details', () => {
    const error = new ValidationError('Invalid field', { field: 'email' });
    
    expect(error.name).toBe('ValidationError');
    expect(error.message).toBe('Invalid field');
    expect(error.details).toEqual({ field: 'email' });
  });

  it('should create ProcessingError with details', () => {
    const error = new ProcessingError('Processing failed', { step: 'conversion' });
    
    expect(error.name).toBe('ProcessingError');
    expect(error.message).toBe('Processing failed');
    expect(error.details).toEqual({ step: 'conversion' });
  });

  it('should create TimeoutError with timeout value', () => {
    const error = new TimeoutError('Operation timeout', 5000);
    
    expect(error.name).toBe('TimeoutError');
    expect(error.message).toBe('Operation timeout');
    expect(error.timeoutMs).toBe(5000);
  });

  it('should create MemoryError with memory usage', () => {
    const error = new MemoryError('Out of memory', 1024);
    
    expect(error.name).toBe('MemoryError');
    expect(error.message).toBe('Out of memory');
    expect(error.memoryUsage).toBe(1024);
  });

  it('should create FormatError with format info', () => {
    const error = new FormatError('Unsupported format', 'avi');
    
    expect(error.name).toBe('FormatError');
    expect(error.message).toBe('Unsupported format');
    expect(error.format).toBe('avi');
  });
});