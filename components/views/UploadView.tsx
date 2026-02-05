"use client";

import UploadForm from "@/components/UploadForm";
import ErrorDisplay from "@/components/ErrorDisplay";
import VideoSettings from "@/components/VideoSettings";
import ProcessingControls from "@/components/ProcessingControls";
import { APIError, VideoProcessingSettings } from "@/lib/types";

interface UploadViewProps {
  selectedFile: File | null;
  error: APIError | null;
  videoSettings: VideoProcessingSettings;
  isProcessing: boolean;
  canStartProcessing: boolean;
  onFileSelect: (file: File) => void;
  onSettingsChange: (settings: VideoProcessingSettings) => void;
  onStartProcessing: () => void;
  onRetry: () => void;
  onDismissError: () => void;
}

export default function UploadView({
  selectedFile,
  error,
  videoSettings,
  isProcessing,
  canStartProcessing,
  onFileSelect,
  onSettingsChange,
  onStartProcessing,
  onRetry,
  onDismissError,
}: UploadViewProps) {
  return (
    <div className="space-y-4 w-full">
      {error && (
        <div className="bg-red-900/60 border border-red-500/50 backdrop-blur-md rounded-lg p-4">
          <ErrorDisplay
            error={error}
            onRetry={onRetry}
            onDismiss={onDismissError}
          />
        </div>
      )}

      <div className="bg-black/60 backdrop-blur-md border border-white/20 rounded-lg p-4">
        <UploadForm
          onFileSelect={onFileSelect}
          disabled={isProcessing}
          selectedFile={selectedFile}
        />
      </div>

      {selectedFile && (
        <div className="bg-black/60 backdrop-blur-md border border-white/20 rounded-lg p-4">
          <h3 className="text-xs font-mono tracking-widest text-green-400 mb-3">
            SETTINGS
          </h3>
          <VideoSettings
            settings={videoSettings}
            onSettingsChange={onSettingsChange}
            disabled={isProcessing}
          />
        </div>
      )}

      {selectedFile && (
        <div className="flex items-center justify-center">
          <ProcessingControls
            canStartProcessing={canStartProcessing}
            onStartProcessing={onStartProcessing}
          />
        </div>
      )}
    </div>
  );
}
