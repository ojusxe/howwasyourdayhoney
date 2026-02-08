"use client";

import { useState, useEffect, useRef } from "react";
import ClientDownloadButton from "@/components/ClientDownloadButton";
import { useVideoProcessor } from "@/hooks/useVideoProcessor";
import { BackgroundMedia } from "@/components/ui/bg-media";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ViewState } from "@/lib/types";
import { LandingView, UploadView, ProcessingView, PlayerView, DocsView } from "@/components/views";
import { TopInfoBar } from "@/components/layout";

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

  // Handle back navigation
  const handleBack = () => {
    if (currentView === "player") handleRetry();
    navigateTo("landing");
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

  const timeString = date ? date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }) : '00:00';
  const dateString = date ? date.toLocaleDateString('en-US', { weekday: 'long', month: 'numeric', day: 'numeric', year: 'numeric' }) : 'Thursday, 1/1/1970';

  const getSlideClasses = () => {
    return slideDirection === "left" 
      ? "animate-slide-in-right" 
      : "animate-slide-in-left";
  };

  const renderContent = () => {
    switch (currentView) {
      case "landing":
        return <LandingView onNavigateToUpload={() => navigateTo("upload")} />;
      case "upload":
        return (
          <UploadView
            selectedFile={selectedFile}
            error={error}
            videoSettings={videoSettings}
            isProcessing={isProcessing}
            canStartProcessing={canStartProcessing}
            onFileSelect={handleFileSelect}
            onSettingsChange={setVideoSettings}
            onStartProcessing={handleProcessVideo}
            onRetry={handleRetry}
            onDismissError={handleDismissError}
          />
        );
      case "processing":
        return <ProcessingView progressProps={getProgressProps()} />;
      case "player":
        return <PlayerView asciiFrames={asciiFrames} currentFrameIndex={currentFrameIndex} />;
      case "docs":
        return <DocsView />;
    }
  };

  const shouldPlayBgVideo = currentView === "landing" || currentView === "processing";

  return (
    <div className="overflow-hidden h-screen w-screen bg-black">
      <BackgroundMedia variant="dark" type="video" src="https://ldrrpjsierqtrdkobhjh.supabase.co/storage/v1/object/public/projects/demo.mp4" shouldPlay={shouldPlayBgVideo}>
        <div className="relative h-full w-full font-mono text-white p-4 md:p-8 flex flex-col justify-between z-20 select-none">
          
          <TopInfoBar
            currentView={currentView}
            currentFrameIndex={currentFrameIndex}
            totalFrames={asciiFrames.length}
            onBack={handleBack}
          />

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

          <div className="flex justify-between items-end w-full">
            <div className="space-y-2">
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
              {/* Watermark */}
              <p className="text-[10px] text-sm font-mono tracking-wide opacity-80">
                <span className="text-white">built by</span>{" "}
                <span className="text-green-400"><a href="https://ojus.fyi" target="_blank" rel="noopener noreferrer">ojus</a></span>{" "}
                <span className="text-white">for</span>{" "}
                <span className="text-pink-400"><a href="https://clueso.io" target="_blank" rel="noopener noreferrer">clueso</a></span>{" "}
                <span className="text-red-400">&lt;3</span>
              </p>
            </div>

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
