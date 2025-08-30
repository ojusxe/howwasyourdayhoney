'use client';

import React, { useState, useCallback } from 'react';
import { useGhosttyProcessor } from './GhosttyClientProcessor';
import UploadArea from './UploadArea';
import ProgressBar from './ProgressBar';
import ErrorDisplay from './ErrorDisplay';

interface GhosttyUploadProcessorProps {
  onProcessingComplete: (result: any) => void;
}

/**
 * Complete Ghostty video-to-ASCII processor with client-side frame extraction
 * This component handles the entire workflow: upload -> extract frames -> process ASCII
 */
export const GhosttyUploadProcessor: React.FC<GhosttyUploadProcessorProps> = ({
  onProcessingComplete
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [currentStep, setCurrentStep] = useState<'upload' | 'extracting' | 'processing' | 'complete'>('upload');
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);

  // Client-side frame extraction
  const { extractFrames, isProcessing: isExtracting } = useGhosttyProcessor({
    onFramesExtracted: handleFramesExtracted,
    onProgress: (progress, message) => {
      setProgress(progress);
      setProgressMessage(message);
    },
    onError: (error) => {
      setError(error);
      setCurrentStep('upload');
    }
  });

  async function handleFramesExtracted(frames: any[]) {
    try {
      setCurrentStep('processing');
      setProgress(0);
      setProgressMessage('Sending frames for ASCII conversion...');

      // Send frames to server for ASCII processing
      const response = await fetch('/api/process-ghostty', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ frames })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process frames');
      }

      const result = await response.json();
      setJobId(result.jobId);
      setProgressMessage(`Started processing job ${result.jobId}...`);

      // Poll for completion
      pollJobStatus(result.jobId);

    } catch (error) {
      console.error('Failed to process frames:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      setCurrentStep('upload');
    }
  }

  async function pollJobStatus(jobId: string) {
    try {
      const response = await fetch(`/api/status/${jobId}`);
      
      if (!response.ok) {
        throw new Error('Failed to get job status');
      }

      const status = await response.json();
      
      setProgress(status.progress || 0);
      setProgressMessage(status.status === 'processing' ? 
        `Converting frames to ASCII... ${status.progress}%` : 
        status.status
      );

      if (status.status === 'complete') {
        setCurrentStep('complete');
        setProgress(100);
        setProgressMessage('Processing complete!');
        onProcessingComplete(status);
      } else if (status.status === 'error') {
        throw new Error(status.error || 'Processing failed');
      } else {
        // Continue polling
        setTimeout(() => pollJobStatus(jobId), 1000);
      }

    } catch (error) {
      console.error('Failed to poll job status:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      setCurrentStep('upload');
    }
  }

  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);
    setError(null);
    setCurrentStep('extracting');
    setProgress(0);
    setProgressMessage('Starting frame extraction...');
    
    // Start client-side frame extraction
    extractFrames(file);
  }, [extractFrames]);

  const handleReset = useCallback(() => {
    setSelectedFile(null);
    setCurrentStep('upload');
    setProgress(0);
    setProgressMessage('');
    setError(null);
    setJobId(null);
  }, []);

  const isProcessing = currentStep !== 'upload' && currentStep !== 'complete';

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Ghostty Video-to-ASCII Converter
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Convert videos to ASCII art using the exact Ghostty algorithm
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Processing Error
              </h3>
              <p className="mt-2 text-sm text-red-700 dark:text-red-300">
                {error}
              </p>
              <div className="mt-4">
                <button
                  onClick={handleReset}
                  className="bg-red-100 dark:bg-red-800 px-4 py-2 rounded-md text-sm font-medium text-red-800 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {currentStep === 'upload' && (
        <UploadArea
          onFileSelect={handleFileSelect}
          isProcessing={false}
          acceptedFormats={['video/mp4', 'video/webm']}
          maxSize={100 * 1024 * 1024} // 100MB
          maxDuration={60} // 60 seconds
        />
      )}

      {isProcessing && (
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              {currentStep === 'extracting' ? 'Extracting Frames' : 'Converting to ASCII'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {progressMessage}
            </p>
          </div>
          
          <ProgressBar 
            progress={progress}
            currentFrame={Math.floor(progress)}
            totalFrames={100}
            status={currentStep === 'extracting' ? 'processing' : 'processing'}
            message={progressMessage}
          />

          {selectedFile && (
            <div className="text-center text-sm text-gray-500">
              Processing: {selectedFile.name}
              {jobId && (
                <div className="font-mono text-xs mt-1">
                  Job ID: {jobId}
                </div>
              )}
            </div>
          )}

          <div className="text-center">
            <button
              onClick={handleReset}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {currentStep === 'complete' && (
        <div className="text-center space-y-4">
          <div className="text-green-600 dark:text-green-400">
            <svg className="w-16 h-16 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Processing Complete!
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Your video has been converted to ASCII art using Ghostty's algorithm.
          </p>
          <button
            onClick={handleReset}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Process Another Video
          </button>
        </div>
      )}

      <div className="text-xs text-gray-500 text-center space-y-1">
        <p>• Uses exact Ghostty FFmpeg settings: scale=100:-2,fps=24</p>
        <p>• Client-side frame extraction, server-side ASCII conversion</p>
        <p>• Output format matches Ghostty's span class structure</p>
      </div>
    </div>
  );
};

export default GhosttyUploadProcessor;
