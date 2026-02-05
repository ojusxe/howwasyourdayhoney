"use client";

import { useState, useEffect, useRef } from "react";
import UploadForm from "@/components/UploadForm";
import ProgressBar from "@/components/ProgressBar";
import ErrorDisplay from "@/components/ErrorDisplay";
import VideoSettings from "@/components/VideoSettings";
import ProcessingControls from "@/components/ProcessingControls";
import ClientDownloadButton from "@/components/ClientDownloadButton";
import { useVideoProcessor } from "@/hooks/useVideoProcessor";
import { BackgroundMedia } from "@/components/ui/bg-media";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import GettingStarted from "@/components/docs/GettingStarted";
import HowItWorks from "@/components/docs/HowItWorks";
import CodeExamples from "@/components/docs/CodeExamples";
import Troubleshooting from "@/components/docs/Troubleshooting";

type ViewState = "landing" | "upload" | "processing" | "player" | "docs";

export default function Home() {
  const [currentView, setCurrentView] = useState<ViewState>("landing");
  const [slideDirection, setSlideDirection] = useState<"left" | "right">("left");
  const [date, setDate] = useState<Date | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Player state
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const playerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setDate(new Date());
    const timer = setInterval(() => {
      setDate(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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

  // Navigate to a view with animation
  const navigateTo = (view: ViewState) => {
    const viewOrder: ViewState[] = ["landing", "upload", "processing", "player", "docs"];
    const currentIndex = viewOrder.indexOf(currentView);
    const targetIndex = viewOrder.indexOf(view);
    setSlideDirection(targetIndex > currentIndex ? "left" : "right");
    setCurrentView(view);
  };

  // Auto-navigate to processing when conversion starts
  useEffect(() => {
    if (isProcessing && currentView === "upload") {
      navigateTo("processing");
    }
  }, [isProcessing, currentView]);

  // Auto-navigate to player when conversion is complete
  useEffect(() => {
    if (isComplete && asciiFrames.length > 0 && (currentView === "upload" || currentView === "processing")) {
      setCurrentFrameIndex(0);
      setIsPlaying(true);
      navigateTo("player");
    }
  }, [isComplete, asciiFrames.length, currentView]);

  // Player animation loop
  useEffect(() => {
    if (currentView === "player" && isPlaying && asciiFrames.length > 1) {
      playerIntervalRef.current = setInterval(() => {
        setCurrentFrameIndex((prev) => (prev + 1) % asciiFrames.length);
      }, 1000 / 24); // 24 FPS
    } else {
      if (playerIntervalRef.current) {
        clearInterval(playerIntervalRef.current);
        playerIntervalRef.current = null;
      }
    }
    return () => {
      if (playerIntervalRef.current) {
        clearInterval(playerIntervalRef.current);
      }
    };
  }, [currentView, isPlaying, asciiFrames.length]);

  // Player controls
  const togglePlayback = () => setIsPlaying(!isPlaying);
  const goToFrame = (index: number) => {
    setCurrentFrameIndex(Math.max(0, Math.min(index, asciiFrames.length - 1)));
  };

  // Formatting helper for date and time
  const timeString = date ? date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }) : '00:00';
  const dateString = date ? date.toLocaleDateString('en-US', { weekday: 'long', month: 'numeric', day: 'numeric', year: 'numeric' }) : 'Thursday, 1/1/1970';

  // Animation classes based on slide direction
  const getSlideClasses = () => {
    return slideDirection === "left" 
      ? "animate-slide-in-right" 
      : "animate-slide-in-left";
  };

  // Landing content
  const renderLandingContent = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs md:text-sm tracking-widest opacity-60 uppercase font-mono">Video → ASCII Art</p>
        <h1 className="text-2xl md:text-4xl font-bold tracking-wide leading-tight max-w-xl font-mono">
          TRANSFORM YOUR VIDEOS
          <br />
          <span className="text-green-400">INTO ASCII ART</span>
        </h1>
      </div>
      <p className="text-sm md:text-base text-gray-300 max-w-md opacity-80 font-mono">
        Client-side video processing. No uploads. Pure browser magic.
      </p>
      
      <button
        onClick={() => navigateTo("upload")}
        className="group relative px-8 py-4 border border-white/80 bg-black/30 backdrop-blur-sm text-white uppercase tracking-[0.2em] text-sm font-semibold hover:bg-white hover:text-black transition-all duration-300 font-mono"
      >
        Start Converting
      </button>
    </div>
  );

  // Upload content
  const renderUploadContent = () => (
    <div className="space-y-4 w-full">
      {error && (
        <div className="bg-red-900/60 border border-red-500/50 backdrop-blur-md rounded-lg p-4">
          <ErrorDisplay
            error={error}
            onRetry={handleRetry}
            onDismiss={handleDismissError}
          />
        </div>
      )}

      <div className="bg-black/60 backdrop-blur-md border border-white/20 rounded-lg p-4">
        <UploadForm
          onFileSelect={handleFileSelect}
          disabled={isProcessing}
          selectedFile={selectedFile}
        />
      </div>

      {selectedFile && (
        <div className="bg-black/60 backdrop-blur-md border border-white/20 rounded-lg p-4">
          <h3 className="text-xs font-mono tracking-widest text-green-400 mb-3">SETTINGS</h3>
          <VideoSettings
            settings={videoSettings}
            onSettingsChange={setVideoSettings}
            disabled={isProcessing}
          />
        </div>
      )}

      {selectedFile && (
        <div className="flex items-center justify-center">
          <ProcessingControls
            canStartProcessing={canStartProcessing}
            onStartProcessing={handleProcessVideo}
          />
        </div>
      )}
    </div>
  );

  // Player content - just the ASCII frames
  const renderPlayerContent = () => (
    <div className="w-full h-full flex items-center justify-center">
      <pre className="text-green-400 font-mono text-[0.5rem] md:text-xs leading-tight whitespace-pre overflow-auto max-h-full">
        {asciiFrames[currentFrameIndex]}
      </pre>
    </div>
  );

  // Processing content - centered progress display
  const renderProcessingContent = () => (
    <div className="space-y-6 w-full text-center">
      <div className="space-y-2">
        <p className="text-xs md:text-sm tracking-widest opacity-60 uppercase font-mono">Processing</p>
        <h2 className="text-xl md:text-2xl font-bold tracking-wide font-mono text-green-400">
          CONVERTING TO ASCII
        </h2>
      </div>
      
      <div className="bg-black/60 backdrop-blur-md border border-white/20 rounded-lg p-6">
        <ProgressBar {...getProgressProps()} />
      </div>

      <p className="text-xs text-gray-400 font-mono opacity-70">
        This may take a moment depending on video length and settings...
      </p>
    </div>
  );

  // Docs content - inline documentation
  const renderDocsContent = () => (
    <div className="space-y-6 w-full max-w-3xl overflow-y-auto max-h-[70vh]">
      <div className="bg-black/60 backdrop-blur-md border border-white/20 rounded-lg p-6 space-y-6">
        <GettingStarted />
      </div>

      <div className="bg-black/60 backdrop-blur-md border border-white/20 rounded-lg p-6 space-y-6">
        <HowItWorks />
      </div>

      <div className="bg-black/60 backdrop-blur-md border border-white/20 rounded-lg p-6 space-y-6">
        <CodeExamples />
      </div>

      <div className="bg-black/60 backdrop-blur-md border border-white/20 rounded-lg p-6 space-y-6">
        <Troubleshooting />
      </div>

      <div className="bg-black/60 backdrop-blur-md border border-green-500/30 rounded-lg p-6">
        <h3 className="text-lg font-bold text-green-400 mb-4 font-mono">Privacy & Security</h3>
        <ul className="space-y-2 text-sm text-gray-300 font-mono">
          <li className="flex items-start gap-2">
            <span className="text-green-400">•</span>
            <span>All processing happens in your browser - no server uploads</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400">•</span>
            <span>Your videos never leave your device</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400">•</span>
            <span>No data is stored or transmitted to external servers</span>
          </li>
        </ul>
      </div>
    </div>
  );

  // Render the current view content
  const renderContent = () => {
    switch (currentView) {
      case "landing":
        return renderLandingContent();
      case "upload":
        return renderUploadContent();
      case "processing":
        return renderProcessingContent();
      case "player":
        return renderPlayerContent();
      case "docs":
        return renderDocsContent();
    }
  };

  // Determine if background video should play based on current view
  const shouldPlayBgVideo = currentView === "landing" || currentView === "processing";

  return (
    <div className="overflow-hidden h-screen w-screen bg-black">
      <BackgroundMedia variant="dark" type="video" src="/demo2.mp4" shouldPlay={shouldPlayBgVideo}>
        {/* Terminal Overlay UI */}
        <div className="relative h-full w-full font-mono text-white p-4 md:p-8 flex flex-col justify-between z-20 select-none">
          
          {/* Top Info Bar */}
          <div className="flex flex-row justify-between items-start w-full">
            {/* Top Left - Frame info with back button below for non-landing views */}
            <div className="space-y-1 text-xs md:text-sm tracking-widest">
              <p className={currentView === "player" ? "text-green-400" : "opacity-70"}>
                {currentView === "player" ? `FRAME_${String(currentFrameIndex + 1).padStart(3, '0')}` : "FRAME_001"}
              </p>
              <p className="opacity-70">{currentView === "player" ? `${asciiFrames.length} TOTAL` : "ASCII_GEN"}</p>
              <p className="opacity-70">00:00:00:00</p>
              {currentView !== "landing" && (
                <button
                  onClick={() => {
                    if (currentView === "player") handleRetry();
                    navigateTo("landing");
                  }}
                  className="opacity-70 hover:opacity-100 transition-opacity flex items-center gap-1 mt-2"
                >
                  ← BACK
                </button>
              )}
            </div>

            {/* Top Center - View heading */}
            <div className="absolute left-1/2 -translate-x-1/2 text-center">
              {currentView === "landing" && (
                <p className="text-xs md:text-sm tracking-widest opacity-60 font-mono">VIDEO → ASCII</p>
              )}
              {currentView === "upload" && (
                <p className="text-xs md:text-sm tracking-widest opacity-60 font-mono">STEP 1: UPLOAD</p>
              )}
              {currentView === "processing" && (
                <p className="text-xs md:text-sm tracking-widest text-green-400 font-mono animate-pulse">PROCESSING...</p>
              )}
              {currentView === "player" && (
                <p className="text-xs md:text-sm tracking-widest opacity-60 font-mono">PLAYBACK</p>
              )}
              {currentView === "docs" && (
                <p className="text-xs md:text-sm tracking-widest opacity-60 font-mono">DOCUMENTATION</p>
              )}
            </div>

            {/* Top Right */}
            <div className="text-right space-y-1 text-xs md:text-sm tracking-widest opacity-70">
              <p>MODE</p>
              <p>{currentView === "player" ? "PLAYBACK" : currentView === "processing" ? "PROCESSING" : currentView === "docs" ? "DOCS" : "CONVERT"}</p>
              <p className="text-green-400 animate-pulse">// ONLINE</p>
            </div>
          </div>

          {/* Center Content - Animated */}
          <div 
            ref={contentRef}
            key={currentView}
            className={`flex-1 flex items-center overflow-y-auto py-4 ${
              currentView === "landing" 
                ? "justify-start px-6 md:px-16" 
                : "justify-center px-6 md:px-8"
            } ${getSlideClasses()}`}
          >
            <div className={
              currentView === "landing" 
                ? "" 
                : currentView === "player" 
                ? "w-full h-full" 
                : currentView === "processing"
                ? "w-full max-w-lg flex items-center justify-center"
                : "w-full max-w-2xl"
            }>
              {renderContent()}
            </div>
          </div>

          {/* Bottom Info Bar */}
          <div className="flex justify-between items-end w-full">
            {/* Bottom Left: Date/Time or Download */}
            {currentView === "player" ? (
              <ClientDownloadButton
                frames={asciiFrames}
                disabled={!isComplete}
                onDownload={handleDownload}
                filename="ascii-animation"
              />
            ) : (
              <div className="space-y-1 font-mono">
                <p className="text-xl md:text-3xl font-medium tracking-wide">
                  {timeString}
                </p>
                <p className="text-xs md:text-sm text-gray-300 tracking-wider uppercase">
                  {dateString}
                </p>
              </div>
            )}

            {/* Bottom Center: Player Controls (only in player view) */}
            {currentView === "player" && (
              <TooltipProvider delayDuration={200}>
                <div className="absolute left-1/2 -translate-x-1/2 bottom-4 md:bottom-8 flex items-center gap-4">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => goToFrame(0)}
                        className="px-3 py-2 text-sm bg-white/10 hover:bg-white/20 text-white/70 rounded transition-colors font-mono"
                      >
                        |&lt;
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top">First Frame</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => goToFrame(currentFrameIndex - 1)}
                        className="px-3 py-2 text-sm bg-white/10 hover:bg-white/20 text-white/70 rounded transition-colors font-mono disabled:opacity-30"
                        disabled={currentFrameIndex === 0}
                      >
                        &lt;
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top">Previous Frame</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={togglePlayback}
                        className="flex items-center justify-center w-12 h-12 bg-green-500/20 border border-green-500/50 hover:bg-green-500 text-green-400 hover:text-black rounded-full transition-colors"
                      >
                        {isPlaying ? (
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top">{isPlaying ? "Pause" : "Play"}</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => goToFrame(currentFrameIndex + 1)}
                        className="px-3 py-2 text-sm bg-white/10 hover:bg-white/20 text-white/70 rounded transition-colors font-mono disabled:opacity-30"
                        disabled={currentFrameIndex === asciiFrames.length - 1}
                      >
                        &gt;
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top">Next Frame</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => goToFrame(asciiFrames.length - 1)}
                        className="px-3 py-2 text-sm bg-white/10 hover:bg-white/20 text-white/70 rounded transition-colors font-mono"
                      >
                        &gt;|
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top">Last Frame</TooltipContent>
                  </Tooltip>
                </div>
              </TooltipProvider>
            )}

            {/* Bottom Right: Docs Link or Convert Another */}
            {currentView === "player" ? (
              <button
                onClick={() => {
                  handleRetry();
                  navigateTo("upload");
                }}
                className="px-4 py-2 border border-white/60 bg-black/40 backdrop-blur-sm text-white text-xs md:text-sm tracking-widest uppercase hover:bg-white hover:text-black transition-all duration-300 font-mono"
              >
                Convert Another →
              </button>
            ) : currentView === "docs" ? (
              <button
                onClick={() => navigateTo("landing")}
                className="px-4 py-2 border border-white/60 bg-black/40 backdrop-blur-sm text-white text-xs md:text-sm tracking-widest uppercase hover:bg-white hover:text-black transition-all duration-300 font-mono"
              >
                ← Back to Home
              </button>
            ) : currentView === "processing" ? (
              <div className="text-xs text-gray-400 font-mono opacity-60">Please wait...</div>
            ) : (
              <button
                onClick={() => navigateTo("docs")}
                className="px-4 py-2 border border-white/60 bg-black/40 backdrop-blur-sm text-white text-xs md:text-sm tracking-widest uppercase hover:bg-white hover:text-black transition-all duration-300 font-mono"
              >
                Documentation →
              </button>
            )}
          </div>

        </div>
      </BackgroundMedia>
    </div>
  );
}
