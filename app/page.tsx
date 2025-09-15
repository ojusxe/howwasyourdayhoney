"use client";

import { useState, useCallback } from "react";
import Header from "@/components/Header";
import UploadForm from "@/components/UploadForm";
import ProgressBar from "@/components/ProgressBar";
import PreviewPlayer from "@/components/PreviewPlayer";
import ClientDownloadButton from "@/components/ClientDownloadButton";
import ErrorDisplay from "@/components/ErrorDisplay";
import { extractFrames } from "@/lib/clientVideoProcessor";
import { convertFramesToAscii } from "@/lib/clientAsciiConverter";
import { ErrorType, OPTIMIZED_CHARACTER_SET } from "@/lib/types";
import VideoSettings, { VideoProcessingSettings } from "@/components/VideoSettings";

type AppState = "idle" | "processing" | "complete" | "error";

interface ProcessingError {
  type: ErrorType;
  message: string;
  timestamp: Date;
}

export default function Home() {
  const [appState, setAppState] = useState<AppState>("idle");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [asciiFrames, setAsciiFrames] = useState<string[]>([]);
  const [error, setError] = useState<ProcessingError | null>(null);
  const [videoSettings, setVideoSettings] = useState<VideoProcessingSettings>({
    contrast: 1.2,
    brightness: 0,
    width: 120,
    useCustomCharacterSet: false,
    customCharacterSet: OPTIMIZED_CHARACTER_SET
  });

  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);
    setError(null);
    setAppState("idle");
    setProgress(0);
    setAsciiFrames([]);
  }, []);

  const handleProcessVideo = useCallback(async () => {
    if (!selectedFile) return;

    console.log('Starting video processing for:', selectedFile.name);

    // Check browser compatibility
    if (typeof SharedArrayBuffer === 'undefined') {
      console.error('SharedArrayBuffer not supported');
      setError({
        type: ErrorType.PROCESSING_ERROR,
        message: "Your browser doesn't support SharedArrayBuffer, which is required for video processing. Please enable it in your browser settings or use a different browser.",
        timestamp: new Date(),
      });
      return;
    }

    if (typeof WebAssembly === 'undefined') {
      console.error('WebAssembly not supported');
      setError({
        type: ErrorType.PROCESSING_ERROR,
        message: "Your browser doesn't support WebAssembly, which is required for video processing. Please use a modern browser.",
        timestamp: new Date(),
      });
      return;
    }

    setAppState("processing");
    setError(null);
    setProgress(0);
    setAsciiFrames([]);

    try {
      // Step 1: Extract frames from video
      console.log("Starting frame extraction...");
      setProgress(5); // Show initial progress
      
      const frameBlobs = await extractFrames(selectedFile, (extractProgress) => {
        // Frame extraction is roughly 70% of total work
        const totalProgress = Math.round(5 + (extractProgress * 0.65));
        console.log('Frame extraction progress:', totalProgress + '%');
        setProgress(totalProgress);
      });

      console.log(`Extracted ${frameBlobs.length} frames`);
      setProgress(70);

      if (frameBlobs.length === 0) {
        throw new Error('No frames were extracted from the video. Please try a different video file.');
      }

      // Step 2: Convert frames to ASCII
      console.log("Starting ASCII conversion...");
      const frames = await convertFramesToAscii(
        frameBlobs,
        { 
          width: videoSettings.width,
          contrast: videoSettings.contrast,
          brightness: videoSettings.brightness,
          characterSet: videoSettings.useCustomCharacterSet 
            ? videoSettings.customCharacterSet 
            : OPTIMIZED_CHARACTER_SET
        },
        (current, total) => {
          // ASCII conversion is the remaining 30%
          const conversionProgress = (current / total) * 30;
          const totalProgress = Math.round(70 + conversionProgress);
          console.log('ASCII conversion progress:', totalProgress + '%');
          setProgress(totalProgress);
        }
      );

      console.log(`Converted ${frames.length} frames to ASCII`);

      if (frames.length === 0) {
        throw new Error('Failed to convert frames to ASCII. Please try again.');
      }

      setAsciiFrames(frames);
      setProgress(100);
      setAppState("complete");
      console.log('Processing completed successfully!');
    } catch (err) {
      console.error("Processing failed:", err);
      setError({
        type: ErrorType.PROCESSING_ERROR,
        message: err instanceof Error ? err.message : "Processing failed. Please try again.",
        timestamp: new Date(),
      });
      setAppState("error");
    }
  }, [selectedFile]);

  const handleRetry = useCallback(() => {
    setError(null);
    setAppState("idle");
    setProgress(0);
    setAsciiFrames([]);
  }, []);

  const handleDownload = useCallback(() => {
    // Reset after download
    setTimeout(() => {
      setAppState("idle");
      setSelectedFile(null);
      setProgress(0);
      setAsciiFrames([]);
    }, 1000);
  }, []);

  const handleDismissError = useCallback(() => {
    setError(null);
    if (appState === "error") {
      setAppState("idle");
    }
  }, [appState]);

  const getProgressProps = () => {
    return {
      progress,
      currentFrame: 0,
      totalFrames: asciiFrames.length,
      status: appState === "processing" ? ("processing" as const) : 
              appState === "complete" ? ("complete" as const) : 
              appState === "error" ? ("error" as const) : ("idle" as const),
      message: error?.message,
    };
  };

  const canStartProcessing = selectedFile && appState === "idle";
  const isProcessing = appState === "processing";
  const isComplete = appState === "complete";

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            How Was Your Day Honey?
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-4">
            Turn your videos into beautiful ASCII art animations! 
            Upload a short video and watch it transform into retro-style terminal art.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-2xl mx-auto">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">
              Video Requirements
            </h3>
            <div className="text-xs text-blue-800 space-y-1">
              <p>
                <strong>Formats:</strong> MP4, WebM, AVI, MOV
              </p>
              <p>
                <strong>Max Size:</strong> 50MB | <strong>Max Duration:</strong>{" "}
                30 seconds
              </p>
              <p>
                <strong>Frame Rate:</strong> 24 FPS for smooth animations
              </p>
              <p>
                <strong>Processing:</strong> Done entirely in your browser - no server upload needed!
              </p>
              <p className="text-xs text-blue-600 mt-2">
                <strong>Works with:</strong> Any animated content - movies, games, animations, screen recordings
              </p>
              <p className="text-xs text-blue-600">
                <strong>Customizable:</strong> Use your own characters for unique ASCII art styles
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Error Display */}
          {error && (
            <ErrorDisplay
              error={error}
              onRetry={handleRetry}
              onDismiss={handleDismissError}
            />
          )}

          {/* Upload Form */}
          <UploadForm
            onFileSelect={handleFileSelect}
            disabled={isProcessing}
            selectedFile={selectedFile}
          />

          {/* Video Settings */}
          {selectedFile && (
            <VideoSettings
              settings={videoSettings}
              onSettingsChange={setVideoSettings}
              disabled={isProcessing}
            />
          )}

          {/* Start Processing Button */}
          {canStartProcessing && (
            <div className="text-center">
              <button
                onClick={handleProcessVideo}
                className="btn-primary px-8 py-3 text-lg"
              >
                Start Conversion
              </button>
            </div>
          )}

          {/* Progress Bar */}
          {(isProcessing || isComplete) && (
            <ProgressBar {...getProgressProps()} />
          )}

          {/* ASCII Animation Preview */}
          {isComplete && asciiFrames.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                ASCII Animation Preview
              </h3>
              <PreviewPlayer 
                frames={asciiFrames}
                fps={24}
              />
            </div>
          )}

          {/* Download Button */}
          {isComplete && asciiFrames.length > 0 && (
            <ClientDownloadButton
              frames={asciiFrames}
              disabled={!isComplete}
              onDownload={handleDownload}
              filename="ascii-animation"
            />
          )}
        </div>
      </main>
    </div>
  );
}