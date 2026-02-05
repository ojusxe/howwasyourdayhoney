'use client';

import { ProgressBarProps } from '@/lib/types';

export default function ProgressBar({
  progress,
  currentFrame,
  totalFrames,
  status,
  message
}: ProgressBarProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'processing':
        return 'bg-blue-500';
      case 'complete':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-300';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'idle':
        return 'ready to process';
      case 'processing':
        return `processing frame ${currentFrame} of ${totalFrames}`;
      case 'complete':
        return 'processing complete!';
      case 'error':
        return 'processing failed';
      default:
        return '';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'processing':
        return (
          // loading spinner for processing state
          <svg className="animate-spin w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        );
      case 'complete':
        return (
          // success checkmark
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'error':
        return (
          // error cross mark
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      default:
        return null;
    }
  };

  if (status === 'idle') {
    return null;
  }

  return (
    <div className="rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-mono tracking-widest text-green-400">PROCESSING</h3>
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <span className="text-sm font-medium text-white font-mono">
            {Math.round(progress)}%
          </span>
        </div>
      </div>

      {/* Progress Bar - main progress indicator */}
      <div className="mb-4">
        <div className="w-full bg-white/20 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${getStatusColor()}`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>

      {/* Status Text - displays current processing info */}
      <div className="flex justify-between items-center text-sm">
        <span className="text-white/70 font-mono text-xs">
          {message || getStatusText()}
        </span>
        
        {totalFrames > 0 && (
          <span className="text-white/50 font-mono text-xs">
            {currentFrame}/{totalFrames} frames
          </span>
        )}
      </div>

      {/* Processing Steps - shows detailed progress stages */}
      {status === 'processing' && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center text-xs text-white/50 font-mono">
            <div className={`w-2 h-2 rounded-full mr-2 ${progress > 0 ? 'bg-green-500' : 'bg-white/30'}`} />
            video uploaded
          </div>
          <div className="flex items-center text-xs text-white/50 font-mono">
            <div className={`w-2 h-2 rounded-full mr-2 ${progress > 10 ? 'bg-green-500' : progress > 0 ? 'bg-blue-500' : 'bg-white/30'}`} />
            extracting frames
          </div>
          <div className="flex items-center text-xs text-white/50 font-mono">
            <div className={`w-2 h-2 rounded-full mr-2 ${progress > 50 ? 'bg-green-500' : progress > 10 ? 'bg-blue-500' : 'bg-white/30'}`} />
            converting to ASCII
          </div>
          <div className="flex items-center text-xs text-white/50 font-mono">
            <div className={`w-2 h-2 rounded-full mr-2 ${progress >= 100 ? 'bg-green-500' : progress > 90 ? 'bg-blue-500' : 'bg-white/30'}`} />
            packaging
          </div>
        </div>
      )}

      {/* Error Message - displayed when processing fails */}
      {status === 'error' && message && (
        <div className="mt-4 p-3 bg-red-900/30 border border-red-500/50 rounded-md">
          <p className="text-sm text-red-300 font-mono">{message}</p>
        </div>
      )}

      {/* Success Message - shown when processing completes successfully */}
      {status === 'complete' && (
        <div className="mt-4 p-3 bg-green-900/30 border border-green-500/50 rounded-md">
          <p className="text-sm text-green-300 font-mono">
            {totalFrames} frames converted successfully!
          </p>
        </div>
      )}
    </div>
  );
}