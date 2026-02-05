'use client';

import { useCallback } from 'react';
import { FileUpload } from '@/components/ui/file-upload';

interface UploadFormProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
  selectedFile?: File | null;
}

export default function UploadForm({ onFileSelect, disabled, selectedFile }: UploadFormProps) {
  const handleFileUpload = useCallback((files: File[]) => {
    if (files.length === 0 || disabled) return;

    const file = files[0];

    // Validate file type - support common video formats
    const validFormats = ['video/mp4', 'video/webm', 'video/avi', 'video/mov', 'video/quicktime'];
    if (!validFormats.includes(file.type)) {
      throw new Error('Invalid file format. Please upload MP4, WebM, AVI, or MOV files.');
    }

    // Check file size (50MB limit for better video support)
    const MAX_FILE_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File size (${Math.round(file.size / 1024 / 1024)}MB) exceeds maximum allowed size (50MB)`);
    }

    onFileSelect(file);
  }, [onFileSelect, disabled]);

  return (
    <div className="space-y-3">
      <div className="w-full max-w-4xl mx-auto min-h-48 border border-dashed border-white/30 bg-black/20 rounded-lg overflow-hidden">
        <FileUpload onChange={handleFileUpload} />
      </div>

      {selectedFile && (
        <div className="bg-green-900/30 border border-green-500/50 rounded-lg p-3">
          <div className="flex items-center space-x-3">
            <svg
              className="w-5 h-5 text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            <div>
              <p className="text-sm font-medium text-green-300 font-mono">
                {selectedFile.name}
              </p>
              <p className="text-xs text-green-400/70 font-mono">
                {(selectedFile.size / 1024 / 1024).toFixed(1)}MB • {selectedFile.type}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}