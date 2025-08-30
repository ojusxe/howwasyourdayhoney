"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import GhosttyUploadProcessor from "@/components/GhosttyUploadProcessor";
import AnimatedTerminal from "@/components/AnimatedTerminal";
import DownloadButton from "@/components/DownloadButton";
import PerformanceDisplay from "@/components/PerformanceDisplay";

export default function Home() {
  const [result, setResult] = useState<any>(null);

  const handleProcessingComplete = (jobResult: any) => {
    console.log('Processing complete:', jobResult);
    setResult(jobResult);
  };

  const handleReset = () => {
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {!result ? (
          <GhosttyUploadProcessor 
            onProcessingComplete={handleProcessingComplete}
          />
        ) : (
          <div className="w-full max-w-6xl mx-auto space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                ASCII Animation Complete!
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Your video has been converted using Ghostty's exact algorithm
              </p>
              <button
                onClick={handleReset}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Convert Another Video
              </button>
            </div>

            {result.frames && result.frames.length > 0 && (
              <div className="space-y-6">
                <AnimatedTerminal
                  frames={result.frames}
                  isPlaying={true}
                  frameRate={24}
                  loop={true}
                />
                
                <div className="flex justify-center space-x-4">
                  <DownloadButton
                    frames={result.frames}
                    filename="ghostty-animation"
                    format="txt"
                  />
                  <DownloadButton
                    frames={result.frames}
                    filename="ghostty-animation"
                    format="html"
                  />
                </div>
              </div>
            )}

            {result.performanceMetrics && (
              <PerformanceDisplay metrics={result.performanceMetrics} />
            )}

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                Processing Summary
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Frames:</span>
                  <div className="font-mono">{result.frames?.length || 0}</div>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Duration:</span>
                  <div className="font-mono">{((result.frames?.length || 0) / 24).toFixed(1)}s</div>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Frame Rate:</span>
                  <div className="font-mono">24 FPS</div>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Resolution:</span>
                  <div className="font-mono">100×44</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
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
      formData.append("settings", JSON.stringify(settings));

      const response = await fetch("/api/process", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Processing failed");
      }

      // Start processing
      setJobStatus({
        jobId: data.jobId,
        status: "pending",
        progress: 0,
        totalFrames: data.totalFrames || 0,
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
        
        const response = await fetch(url);
        const status = await response.json();

        if (!response.ok) {
          throw new Error(status.message || "Failed to get status");
        }

        setJobStatus(status);

        if (status.status === "complete") {
          setAppState("complete");
          clearInterval(interval);
          setStatusPollingInterval(null);
        } else if (status.status === "error") {
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
        console.error("Status polling failed:", err);
        setError({
          type: ErrorType.PROCESSING_ERROR,
          message: "Failed to get processing status",
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
