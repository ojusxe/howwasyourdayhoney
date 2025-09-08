"use client";

import { useState, useCallback } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import UploadForm from "@/components/UploadForm";
import ProgressBar from "@/components/ProgressBar";
import PreviewPlayer from "@/components/PreviewPlayer";
import ClientDownloadButton from "@/components/ClientDownloadButton";
import ErrorDisplay from "@/components/ErrorDisplay";
import { extractFrames } from "@/lib/clientVideoProcessor";
import { convertFramesToAscii } from "@/lib/clientAsciiConverter";
import { ErrorType } from "@/lib/types";

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

  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);
    setError(null);
    setAppState("idle");
    setProgress(0);
    setAsciiFrames([]);
  }, []);

  const handleProcessVideo = useCallback(async () => {
    if (!selectedFile) return;

    // Check browser compatibility
    if (typeof SharedArrayBuffer === 'undefined') {
      setError({
        type: ErrorType.PROCESSING_ERROR,
        message: "Your browser doesn't support SharedArrayBuffer, which is required for video processing. Please enable it in your browser settings or use a different browser.",
        timestamp: new Date(),
      });
      return;
    }

    if (typeof WebAssembly === 'undefined') {
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
      const frameBlobs = await extractFrames(selectedFile, (extractProgress) => {
        // Frame extraction is roughly 70% of total work
        setProgress(Math.round(extractProgress * 0.7));
      });

      console.log(`Extracted ${frameBlobs.length} frames`);

      // Step 2: Convert frames to ASCII
      console.log("Starting ASCII conversion...");
      const frames = await convertFramesToAscii(
        frameBlobs,
        { width: 100 }, // Ghostty-style 100 columns
        (current, total) => {
          // ASCII conversion is the remaining 30%
          const conversionProgress = (current / total) * 30;
          setProgress(Math.round(70 + conversionProgress));
        }
      );

      console.log(`Converted ${frames.length} frames to ASCII`);

      setAsciiFrames(frames);
      setProgress(100);
      setAppState("complete");
    } catch (err) {
      console.error("Processing failed:", err);
      setError({
        type: ErrorType.PROCESSING_ERROR,
        message: err instanceof Error ? err.message : "Processing failed",
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
            Convert Videos to ASCII Art
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-4">
            Upload a short video and convert it into ASCII art frames using
            client-side processing. Perfect for terminal animations and
            retro-style displays.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-2xl mx-auto">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">
              Video Requirements
            </h3>
            <div className="text-xs text-blue-800 space-y-1">
              <p>
                <strong>Formats:</strong> MP4, WebM
              </p>
              <p>
                <strong>Max Size:</strong> 25MB | <strong>Max Duration:</strong>{" "}
                15 seconds
              </p>
              <p>
                <strong>Best Results:</strong> High contrast videos, simple
                shapes, text/graphics
              </p>
              <p>
                <strong>Processing:</strong> Done entirely in your browser - no server upload needed!
              </p>
              <p className="text-xs text-blue-600 mt-2">
                <strong>Browser Requirements:</strong> Chrome 79+, Firefox 72+, Safari 15.2+, or Edge 79+ with WebAssembly and SharedArrayBuffer support
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

      <Footer />
    </div>
  );
}