"use client";

import { useState, useCallback, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import GhosttySettingsPanel from "@/components/GhosttySettingsPanel";
import ProgressBar from "@/components/ProgressBar";
import DownloadButton from "@/components/DownloadButton";
import AnimatedTerminal from "@/components/AnimatedTerminal";
import ErrorDisplay from "@/components/ErrorDisplay";
import PerformanceDisplay from "@/components/PerformanceDisplay";
import { FileUpload } from "@/components/ui/file-upload";
import {
  ConversionSettings,
  DEFAULT_SETTINGS,
  MAX_FILE_SIZE,
  MAX_DURATION,
  APIError,
  ASCIIFrame,
  ErrorType,
} from "@/lib/types";

type AppState = "idle" | "uploading" | "processing" | "complete" | "error";

interface JobStatus {
  jobId: string;
  status: "pending" | "processing" | "complete" | "error";
  progress: number;
  totalFrames: number;
  processedFrames: number;
  error?: string;
  frames?: Array<{
    index: number;
    timestamp: number;
    asciiContent: string;
    width: number;
    height: number;
  }>; // Optional frames data for preview
  performanceMetrics?: {
    conversionTime: number;
    memoryUsageMB: number;
    averageFrameTime: number;
    processingSteps: Array<{
      name: string;
      duration: number;
      memoryUsageMB: number;
    }>;
  };
  optimizationRecommendations?: string[];
}

export default function Home() {
  const [appState, setAppState] = useState<AppState>("idle");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [settings, setSettings] =
    useState<ConversionSettings>(DEFAULT_SETTINGS);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [currentFrame, setCurrentFrame] = useState<ASCIIFrame | null>(null);
  const [error, setError] = useState<APIError | null>(null);
  const [statusPollingInterval, setStatusPollingInterval] =
    useState<NodeJS.Timeout | null>(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (statusPollingInterval) {
        clearInterval(statusPollingInterval);
      }
    };
  }, [statusPollingInterval]);

  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);
    setError(null);
    setAppState("idle");
    setJobStatus(null);
    setCurrentFrame(null);
  }, []);

  const handleFileUpload = useCallback(
    (files: File[]) => {
      if (files.length === 0) return;

      const file = files[0]; // Take only the first file

      // Validate file type
      const validFormats = ["video/mp4", "video/webm"];
      if (!validFormats.includes(file.type)) {
        setError({
          type: ErrorType.VALIDATION_ERROR,
          message: "Invalid file format. Please upload MP4 or WebM files only.",
          timestamp: new Date(),
        });
        return;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        setError({
          type: ErrorType.VALIDATION_ERROR,
          message: `File size (${Math.round(
            file.size / 1024 / 1024
          )}MB) exceeds maximum allowed size (${
            MAX_FILE_SIZE / 1024 / 1024
          }MB)`,
          timestamp: new Date(),
        });
        return;
      }

      // File is valid, proceed
      handleFileSelect(file);
    },
    [handleFileSelect]
  );

  const handleSettingsChange = useCallback(
    (newSettings: ConversionSettings) => {
      setSettings(newSettings);
    },
    []
  );

  const handleStartProcessing = useCallback(async () => {
    if (!selectedFile) return;

    setAppState("uploading");
    setError(null);

    try {
      const formData = new FormData();
      formData.append("video", selectedFile);
      // Note: /api/process-ghostty doesn't need settings as it uses fixed Ghostty configuration

      const response = await fetch("/api/process-ghostty", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || "Processing failed");
      }

      // Start processing
      setJobStatus({
        jobId: data.jobId,
        status: "pending",
        progress: 0,
        totalFrames: data.estimatedFrames || data.totalFrames || 0,
        processedFrames: 0,
      });

      setAppState("processing");
      startStatusPolling(data.jobId);
    } catch (err) {
      console.error("Processing failed:", err);
      setError({
        type: ErrorType.PROCESSING_ERROR,
        message: err instanceof Error ? err.message : "Processing failed",
        timestamp: new Date(),
      });
      setAppState("error");
    }
  }, [selectedFile, settings]);

  const startStatusPolling = useCallback((jobId: string) => {
    const interval = setInterval(async () => {
      try {
        // Include frames in the request if we don't have them yet and job might be complete
        const includeFrames = !jobStatus?.frames && (jobStatus?.status === 'complete' || !jobStatus);
        const url = `/api/status?jobId=${jobId}${includeFrames ? '&includeFrames=true' : ''}`;
        
        console.log(`Polling status for job: ${jobId}`);
        const response = await fetch(url);
        const status = await response.json();

        if (!response.ok) {
          console.error(`Status API error for job ${jobId}:`, status);
          throw new Error(status.message || "Failed to get status");
        }

        console.log(`Job ${jobId} status:`, status.status, `Progress: ${status.progress}%`);
        setJobStatus(status);

        if (status.status === "complete") {
          console.log(`Job ${jobId} completed with ${status.processedFrames} frames`);
          setAppState("complete");
          clearInterval(interval);
          setStatusPollingInterval(null);
        } else if (status.status === "error") {
          console.error(`Job ${jobId} failed:`, status.error);
          setError({
            type: ErrorType.PROCESSING_ERROR,
            message: status.error || "Processing failed",
            timestamp: new Date(),
          });
          setAppState("error");
          clearInterval(interval);
          setStatusPollingInterval(null);
        }
      } catch (err) {
        console.error("Status polling failed for job", jobId, ":", err);
        setError({
          type: ErrorType.PROCESSING_ERROR,
          message: `Failed to get processing status for job ${jobId}. ${err instanceof Error ? err.message : ''}`,
          timestamp: new Date(),
        });
        setAppState("error");
        clearInterval(interval);
        setStatusPollingInterval(null);
      }
    }, 2000); // Poll every 2 seconds

    setStatusPollingInterval(interval);
  }, []);

  const handleDownload = useCallback(() => {
    // Download completed, reset to allow new conversion
    setTimeout(() => {
      setAppState("idle");
      setSelectedFile(null);
      setJobStatus(null);
      setCurrentFrame(null);
    }, 1000);
  }, []);

  const handleRetry = useCallback(() => {
    setError(null);
    setAppState("idle");
    setJobStatus(null);
    setCurrentFrame(null);
    if (statusPollingInterval) {
      clearInterval(statusPollingInterval);
      setStatusPollingInterval(null);
    }
  }, [statusPollingInterval]);

  const handleDismissError = useCallback(() => {
    setError(null);
    if (appState === "error") {
      setAppState("idle");
    }
  }, [appState]);

  const getProgressProps = () => {
    if (!jobStatus) {
      return {
        progress: 0,
        currentFrame: 0,
        totalFrames: 0,
        status: "idle" as const,
        message: undefined,
      };
    }

    return {
      progress: jobStatus.progress,
      currentFrame: jobStatus.processedFrames,
      totalFrames: jobStatus.totalFrames,
      status:
        jobStatus.status === "pending"
          ? ("processing" as const)
          : jobStatus.status === "processing"
          ? ("processing" as const)
          : jobStatus.status === "complete"
          ? ("complete" as const)
          : ("error" as const),
      message: jobStatus.error,
    };
  };

  const canStartProcessing = selectedFile && appState === "idle";
  const isProcessing = appState === "uploading" || appState === "processing";
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
            Ghostty-inspired algorithms. Perfect for terminal animations and
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
                <strong>Output:</strong> 100 columns max, aspect ratio corrected
                (0.44 font ratio)
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

          {/* Upload Area */}
          <div className="w-full max-w-4xl mx-auto min-h-96 border border-dashed bg-white border-neutral-200 rounded-lg">
            <FileUpload onChange={handleFileUpload} />
          </div>

          {/* File Info */}
          {selectedFile && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <svg
                  className="w-5 h-5 text-blue-500"
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
                  <p className="text-sm font-medium text-blue-900">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-blue-700">
                    {(selectedFile.size / 1024 / 1024).toFixed(1)}MB •{" "}
                    {selectedFile.type}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Settings Panel */}
          {selectedFile && (
            <GhosttySettingsPanel
              settings={settings}
              onSettingsChange={handleSettingsChange}
              disabled={isProcessing}
            />
          )}

          {/* Start Processing Button */}
          {canStartProcessing && (
            <div className="text-center">
              <button
                onClick={handleStartProcessing}
                className="btn-primary px-8 py-3 text-lg"
              >
                Start Conversion
              </button>
            </div>
          )}

          {/* Progress Bar */}
          <ProgressBar {...getProgressProps()} />

          {/* ASCII Animation Preview */}
          {isComplete && jobStatus?.frames && jobStatus.frames.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                ASCII Animation Preview
              </h3>
              <AnimatedTerminal 
                frames={jobStatus.frames}
                fps={settings.frameRate}
                title="Ghostty ASCII Video"
                fontSize="medium"
              />
            </div>
          )}

          {/* Download Button */}
          {isComplete && jobStatus && (
            <DownloadButton
              jobId={jobStatus.jobId}
              disabled={!isComplete}
              onDownload={handleDownload}
            />
          )}

          {/* Performance Display */}
          {isComplete && jobStatus?.performanceMetrics && (
            <PerformanceDisplay
              metrics={{
                conversionTime: jobStatus.performanceMetrics.conversionTime,
                memoryUsage:
                  jobStatus.performanceMetrics.memoryUsageMB * 1024 * 1024,
                frameCount: jobStatus.totalFrames,
                averageFrameTime: jobStatus.performanceMetrics.averageFrameTime,
                peakMemoryUsage:
                  jobStatus.performanceMetrics.memoryUsageMB * 1024 * 1024,
                processingSteps:
                  jobStatus.performanceMetrics.processingSteps.map((step) => ({
                    name: step.name,
                    startTime: 0,
                    endTime: step.duration,
                    duration: step.duration,
                    memoryBefore: 0,
                    memoryAfter: step.memoryUsageMB * 1024 * 1024,
                  })),
              }}
              recommendations={jobStatus.optimizationRecommendations}
            />
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
