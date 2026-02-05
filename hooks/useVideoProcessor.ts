import { useState, useCallback } from "react";
import { extractFrames } from "@/lib/clientVideoProcessor";
import { convertFramesToAscii } from "@/lib/clientAsciiConverter";
import { ErrorType, OPTIMIZED_CHARACTER_SET, VideoProcessingSettings } from "@/lib/types";

type AppState = "idle" | "processing" | "complete" | "error";

interface ProcessingError {
  type: ErrorType;
  message: string;
  timestamp: Date;
}

export function useVideoProcessor() {
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
  }, [selectedFile, videoSettings]);

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

  const canStartProcessing = !!(selectedFile && appState === "idle");
  const isProcessing = appState === "processing";
  const isComplete = appState === "complete";

  return {
    // State
    appState,
    selectedFile,
    progress,
    asciiFrames,
    error,
    videoSettings,
    
    // Computed
    canStartProcessing,
    isProcessing,
    isComplete,
    
    // Handlers
    handleFileSelect,
    handleProcessVideo,
    handleRetry,
    handleDownload,
    handleDismissError,
    setVideoSettings,
    getProgressProps,
  };
}
