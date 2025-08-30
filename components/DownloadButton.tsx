'use client';

import { useState } from 'react';
import { DownloadButtonProps } from '@/lib/types';

export default function DownloadButton({
  jobId,
  disabled,
  onDownload
}: DownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const handleDownload = async () => {
    if (!jobId || disabled || isDownloading) return;

    setIsDownloading(true);
    setDownloadError(null);

    try {
      // First check if download is available
      const headResponse = await fetch(`/api/download?jobId=${jobId}`, {
        method: 'HEAD'
      });

      if (!headResponse.ok) {
        throw new Error('Download not available');
      }

      // Get the filename from headers
      const contentDisposition = headResponse.headers.get('Content-Disposition');
      const filename = contentDisposition?.match(/filename="(.+)"/)?.[1] || 'ascii-frames.zip';

      // Start the download
      const response = await fetch(`/api/download?jobId=${jobId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Download failed');
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Notify parent component
      onDownload();

    } catch (error) {
      console.error('Download failed:', error);
      setDownloadError(error instanceof Error ? error.message : 'Download failed');
    } finally {
      setIsDownloading(false);
    }
  };

  const getButtonText = () => {
    if (isDownloading) return 'Downloading...';
    if (disabled) return 'Download Not Ready';
    return 'Download ZIP';
  };

  const getButtonIcon = () => {
    if (isDownloading) {
      return (
        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
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
    }

    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  };

  return (
    <div className="text-center">
      <button
        onClick={handleDownload}
        disabled={disabled || isDownloading || !jobId}
        className={`
          inline-flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200
          ${disabled || !jobId || isDownloading
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-gray-900 text-white hover:bg-gray-800 hover:shadow-lg transform hover:-translate-y-0.5'
          }
        `}
      >
        {getButtonIcon()}
        <span>{getButtonText()}</span>
      </button>

      {downloadError && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">{downloadError}</p>
          <button
            onClick={() => setDownloadError(null)}
            className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {!disabled && jobId && !downloadError && (
        <p className="mt-3 text-sm text-gray-500">
          Your ASCII frames will be packaged in a ZIP file with usage instructions
        </p>
      )}
    </div>
  );
}