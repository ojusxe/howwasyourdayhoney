"use client";

import { useState, useEffect } from "react";
import UploadForm from "@/components/UploadForm";
import ProgressBar from "@/components/ProgressBar";
import ErrorDisplay from "@/components/ErrorDisplay";
import VideoSettings from "@/components/VideoSettings";
import IntroSection from "@/components/IntroSection";
import ProcessingControls from "@/components/ProcessingControls";
import ResultsSection from "@/components/ResultsSection";
import { useVideoProcessor } from "@/hooks/useVideoProcessor";
import { BackgroundMedia } from "@/components/ui/bg-media";
import Image from "next/image";

export default function Home() {
  const [showApp, setShowApp] = useState(false);
  const [date, setDate] = useState<Date | null>(null);

  useEffect(() => {
    // Initial date set
    setDate(new Date());
    // Update every second
    const timer = setInterval(() => {
      setDate(new Date());
    }, 1000);
    // cleanup
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

  if (showApp) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <div className="border-b bg-white relative z-50">
           <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
              <button 
                onClick={() => setShowApp(false)} 
                className="text-sm font-mono hover:underline flex items-center gap-2"
              >
                ← BACK
              </button>
              <div className="flex items-center gap-2 opacity-50">
                 <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                 <span className="font-mono text-sm">ASCII_CONVERTER // READY</span>
              </div>
           </div>
        </div>
        <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500">
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

  // Formatting helper for date and time to match CCTV style
  const timeString = date ? date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }) : '00:00';
  const dateString = date ? date.toLocaleDateString('en-US', { weekday: 'long', month: 'numeric', day: 'numeric', year: 'numeric' }) : 'Thursday, 1/1/1970';

  return (
    <div className="overflow-hidden h-screen w-screen bg-black">
      <BackgroundMedia variant="dark" type="video" src="/demo2.mp4">
        {/* Terminal Overlay UI */}
        <div className="relative h-full w-full font-mono text-white p-4 md:p-8 flex flex-col justify-between z-20 select-none">
          
          {/* Top Info Bar */}
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

          {/* Center Call to Action */}
          <div className="absolute top-1/2 left-0 w-full -translate-y-1/2 pl-6 md:pl-16">
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
                onClick={() => setShowApp(true)}
                className="group relative px-8 py-4 border border-white/80 bg-black/30 backdrop-blur-sm text-white uppercase tracking-[0.2em] text-sm font-semibold hover:bg-white hover:text-black transition-all duration-300 font-mono"
              >
                Start Converting
              </button>
            </div>
          </div>

          {/* Bottom Info Bar */}
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
