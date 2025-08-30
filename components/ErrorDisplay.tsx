'use client';

import { ErrorDisplayProps } from '@/lib/types';

export default function ErrorDisplay({ error, onRetry, onDismiss }: ErrorDisplayProps) {
  if (!error) return null;

  const getErrorIcon = () => {
    switch (error.type) {
      case 'VALIDATION_ERROR':
        return (
          <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'PROCESSING_ERROR':
      case 'MEMORY_ERROR':
        return (
          <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'TIMEOUT_ERROR':
        return (
          <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'FORMAT_ERROR':
        return (
          <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getErrorColor = () => {
    switch (error.type) {
      case 'VALIDATION_ERROR':
        return 'border-yellow-200 bg-yellow-50';
      case 'PROCESSING_ERROR':
      case 'MEMORY_ERROR':
        return 'border-red-200 bg-red-50';
      case 'TIMEOUT_ERROR':
        return 'border-orange-200 bg-orange-50';
      case 'FORMAT_ERROR':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getErrorTitle = () => {
    switch (error.type) {
      case 'VALIDATION_ERROR':
        return 'Validation Error';
      case 'PROCESSING_ERROR':
        return 'Processing Error';
      case 'MEMORY_ERROR':
        return 'Memory Error';
      case 'TIMEOUT_ERROR':
        return 'Timeout Error';
      case 'FORMAT_ERROR':
        return 'Format Error';
      default:
        return 'Error';
    }
  };

  const getErrorSuggestions = () => {
    switch (error.type) {
      case 'VALIDATION_ERROR':
        return [
          'Check that your video file meets the requirements',
          'Ensure the file is in MP4 or WebM format',
          'Verify the file size is under 25MB',
          'Make sure the video duration is under 15 seconds'
        ];
      case 'PROCESSING_ERROR':
        return [
          'Try uploading a different video file',
          'Reduce the resolution scale in settings',
          'Try a lower frame rate setting',
          'Check your internet connection'
        ];
      case 'MEMORY_ERROR':
        return [
          'Try reducing the resolution scale to 50%',
          'Use a lower frame rate (12 FPS)',
          'Upload a shorter video',
          'Close other browser tabs to free up memory'
        ];
      case 'TIMEOUT_ERROR':
        return [
          'Try a shorter video file',
          'Reduce the resolution scale',
          'Use a lower frame rate',
          'Check your internet connection'
        ];
      case 'FORMAT_ERROR':
        return [
          'Convert your video to MP4 or WebM format',
          'Ensure the video file is not corrupted',
          'Try a different video file'
        ];
      default:
        return ['Please try again or contact support if the problem persists'];
    }
  };

  const shouldShowRetry = () => {
    return error.type !== 'VALIDATION_ERROR' && error.type !== 'FORMAT_ERROR';
  };

  return (
    <div className={`border rounded-lg p-6 ${getErrorColor()}`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {getErrorIcon()}
        </div>
        
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {getErrorTitle()}
          </h3>
          
          <p className="text-gray-700 mb-4">
            {error.message}
          </p>

          {/* Error Details */}
          {error.details && (
            <details className="mb-4">
              <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-800">
                Technical Details
              </summary>
              <pre className="mt-2 text-xs text-gray-500 bg-white p-2 rounded border overflow-auto">
                {JSON.stringify(error.details, null, 2)}
              </pre>
            </details>
          )}

          {/* Suggestions */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-800 mb-2">Suggestions:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              {getErrorSuggestions().map((suggestion, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-gray-400 mr-2">•</span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            {shouldShowRetry() && onRetry && (
              <button
                onClick={onRetry}
                className="btn-primary text-sm"
              >
                Try Again
              </button>
            )}
            
            <button
              onClick={onDismiss}
              className="btn-secondary text-sm"
            >
              Dismiss
            </button>
          </div>

          {/* Timestamp */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Error occurred at {error.timestamp.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}