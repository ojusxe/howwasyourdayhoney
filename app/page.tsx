"use client";

import UploadForm from "@/components/UploadForm";
import ProgressBar from "@/components/ProgressBar";
import ErrorDisplay from "@/components/ErrorDisplay";
import VideoSettings from "@/components/VideoSettings";
import IntroSection from "@/components/IntroSection";
import ProcessingControls from "@/components/ProcessingControls";
import ResultsSection from "@/components/ResultsSection";
import { useVideoProcessor } from "@/hooks/useVideoProcessor";

export default function Home() {
  const {
    selectedFile,
    error,
    videoSettings,
    canStartProcessing,
    isProcessing,
    isComplete,
    asciiFrames,
    handleFileSelect,
    handleProcessVideo,
    handleRetry,
    handleDownload,
    handleDismissError,
    setVideoSettings,
    getProgressProps,
  } = useVideoProcessor();

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <IntroSection />

        <div className="space-y-8">
          {error && (
            <ErrorDisplay
              error={error}
              onRetry={handleRetry}
              onDismiss={handleDismissError}
            />
          )}

          <UploadForm
            onFileSelect={handleFileSelect}
            disabled={isProcessing}
            selectedFile={selectedFile}
          />

          {selectedFile && (
            <VideoSettings
              settings={videoSettings}
              onSettingsChange={setVideoSettings}
              disabled={isProcessing}
            />
          )}

          <ProcessingControls
            canStartProcessing={canStartProcessing}
            onStartProcessing={handleProcessVideo}
          />

          {(isProcessing || isComplete) && (
            <ProgressBar {...getProgressProps()} />
          )}

          <ResultsSection
            isComplete={isComplete}
            asciiFrames={asciiFrames}
            onDownload={handleDownload}
          />
        </div>
      </main>
    </div>
  );
}