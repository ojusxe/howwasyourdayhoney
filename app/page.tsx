"use client";

import { useState, useEffect, useRef } from "react";
import UploadForm from "@/components/UploadForm";
import ProgressBar from "@/components/ProgressBar";
import ErrorDisplay from "@/components/ErrorDisplay";
import VideoSettings from "@/components/VideoSettings";
import ProcessingControls from "@/components/ProcessingControls";
import PreviewPlayer from "@/components/PreviewPlayer";
import ClientDownloadButton from "@/components/ClientDownloadButton";
import { useVideoProcessor } from "@/hooks/useVideoProcessor";
import { BackgroundMedia } from "@/components/ui/bg-media";
import Image from "next/image";

type ViewState = "landing" | "upload" | "player";

export default function Home() {
  const [currentView, setCurrentView] = useState<ViewState>("landing");
  const [slideDirection, setSlideDirection] = useState<"left" | "right">("left");
  const [date, setDate] = useState<Date | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

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
    const viewOrder: ViewState[] = ["landing", "upload", "player"];
    const currentIndex = viewOrder.indexOf(currentView);
    const targetIndex = viewOrder.indexOf(view);
    setSlideDirection(targetIndex > currentIndex ? "left" : "right");
    setCurrentView(view);
  };

  // Auto-navigate to player when conversion is complete
  useEffect(() => {
    if (isComplete && asciiFrames.length > 0 && currentView === "upload") {
      navigateTo("player");
    }
  }, [isComplete, asciiFrames.length, currentView]);

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
      <div className="flex items-center gap-4 mb-2">
        <button
          onClick={() => navigateTo("landing")}
          className="text-xs md:text-sm tracking-widest opacity-70 hover:opacity-100 transition-opacity font-mono flex items-center gap-2"
        >
          ← BACK
        </button>
        <div className="h-px flex-1 bg-white/20" />
        <span className="text-xs tracking-widest opacity-60 font-mono">STEP 1: UPLOAD</span>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-500/50 backdrop-blur-sm rounded-lg p-4">
          <ErrorDisplay
            error={error}
            onRetry={handleRetry}
            onDismiss={handleDismissError}
          />
        </div>
      )}

      <div className="bg-black/40 backdrop-blur-sm border border-white/20 rounded-lg p-4">
        <UploadForm
          onFileSelect={handleFileSelect}
          disabled={isProcessing}
          selectedFile={selectedFile}
        />
      </div>

      {selectedFile && (
        <div className="bg-black/40 backdrop-blur-sm border border-white/20 rounded-lg p-4">
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

      {(isProcessing || isComplete) && (
        <div className="bg-black/40 backdrop-blur-sm border border-white/20 rounded-lg p-4">
          <ProgressBar {...getProgressProps()} />
        </div>
      )}
    </div>
  );

  // Player content
  const renderPlayerContent = () => (
    <div className="space-y-4 w-full">
      <div className="flex items-center gap-4 mb-2">
        <button
          onClick={() => navigateTo("upload")}
          className="text-xs md:text-sm tracking-widest opacity-70 hover:opacity-100 transition-opacity font-mono flex items-center gap-2"
        >
          ← BACK TO UPLOAD
        </button>
        <div className="h-px flex-1 bg-white/20" />
        <span className="text-xs tracking-widest opacity-60 font-mono">PREVIEW</span>
      </div>

      <div className="bg-black/60 backdrop-blur-sm border border-white/20 rounded-lg p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-mono tracking-widest text-green-400">ASCII PLAYER</h3>
          <span className="text-xs font-mono opacity-60">{asciiFrames.length} FRAMES</span>
        </div>
        <PreviewPlayer 
          frames={asciiFrames}
          fps={24}
        />
      </div>

      <div className="flex justify-center gap-4">
        <ClientDownloadButton
          frames={asciiFrames}
          disabled={!isComplete}
          onDownload={handleDownload}
          filename="ascii-animation"
        />
        <button
          onClick={() => {
            handleRetry();
            navigateTo("upload");
          }}
          className="px-6 py-3 border border-white/60 bg-black/40 backdrop-blur-sm text-white text-sm tracking-widest uppercase hover:bg-white hover:text-black transition-all duration-300 font-mono"
        >
          Convert Another
        </button>
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
      case "player":
        return renderPlayerContent();
    }
  };

  return (
    <div className="overflow-hidden h-screen w-screen bg-black">
      <BackgroundMedia variant="dark" type="video" src="/demo2.mp4">
        {/* Terminal Overlay UI */}
        <div className="relative h-full w-full font-mono text-white p-4 md:p-8 flex flex-col justify-between z-20 select-none">
          
          {/* Top Info Bar - Always visible */}
          <div className="flex flex-row justify-between items-start w-full">
            {/* Top Left */}
            <div className="space-y-1 text-xs md:text-sm tracking-widest opacity-70">
              <p>FRAME_001</p>
              <p>ASCII_GEN</p>
              <p>00:00:00:00</p>
            </div>
            
            {/* Top Center Logo */}
            <div className="absolute left-1/2 transform -translate-x-1/2 top-6 md:top-8 w-32 md:w-48 text-center">
              <Image 
                src="/logo.png" 
                width={200} 
                height={60} 
                alt="ASCII Frame Generator" 
                className="mx-auto"
                priority
              />
            </div>

            {/* Top Right */}
            <div className="text-right space-y-1 text-xs md:text-sm tracking-widest opacity-70">
              <p>MODE</p>
              <p>CONVERT</p>
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
            <div className={currentView === "landing" ? "" : "w-full max-w-2xl"}>
              {renderContent()}
            </div>
          </div>

          {/* Bottom Info Bar - Always visible */}
          <div className="flex justify-between items-end w-full">
            {/* Bottom Left: Date/Time */}
            <div className="space-y-1 font-mono">
              <p className="text-xl md:text-3xl font-medium tracking-wide">
                {timeString}
              </p>
              <p className="text-xs md:text-sm text-gray-300 tracking-wider uppercase">
                {dateString}
              </p>
            </div>

            {/* Bottom Right: Docs Link */}
            <a 
              href="/docs" 
              className="px-4 py-2 border border-white/60 bg-black/40 backdrop-blur-sm text-white text-xs md:text-sm tracking-widest uppercase hover:bg-white hover:text-black transition-all duration-300 font-mono"
            >
              Documentation →
            </a>
          </div>

        </div>
      </BackgroundMedia>
    </div>
  );
}
