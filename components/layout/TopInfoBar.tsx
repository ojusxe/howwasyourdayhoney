"use client";

import { ViewState } from "@/lib/types";

interface TopInfoBarProps {
  currentView: ViewState;
  currentFrameIndex: number;
  totalFrames: number;
  onBack: () => void;
}

export default function TopInfoBar({
  currentView,
  currentFrameIndex,
  totalFrames,
  onBack,
}: TopInfoBarProps) {
  return (
    <div className="flex flex-row justify-between items-start w-full">
      {/* Top Left - Frame info with back button below for non-landing views */}
      <div className="space-y-1 text-xs md:text-sm tracking-widest">
        <p className={currentView === "player" ? "text-green-400" : "opacity-70"}>
          {currentView === "player"
            ? `FRAME_${String(currentFrameIndex + 1).padStart(3, "0")}`
            : "FRAME_001"}
        </p>
        <p className="opacity-70">
          {currentView === "player" ? `${totalFrames} TOTAL` : "ASCII_GEN"}
        </p>
        <p className="opacity-70">00:00:00:00</p>
        {currentView !== "landing" && (
          <button
            onClick={onBack}
            className="opacity-70 hover:opacity-100 transition-opacity flex items-center gap-1 mt-2"
          >
            ← BACK
          </button>
        )}
      </div>

      {/* Top Center - View heading */}
      <div className="absolute left-1/2 -translate-x-1/2 text-center">
        {currentView === "landing" && (
          <p className="text-xs md:text-sm tracking-widest opacity-60 font-mono">
            VIDEO → ASCII
          </p>
        )}
        {currentView === "upload" && (
          <p className="text-xs md:text-sm tracking-widest opacity-60 font-mono">
            STEP 1: UPLOAD
          </p>
        )}
        {currentView === "processing" && (
          <p className="text-xs md:text-sm tracking-widest text-green-400 font-mono animate-pulse">
            PROCESSING...
          </p>
        )}
        {currentView === "player" && (
          <p className="text-xs md:text-sm tracking-widest opacity-60 font-mono">
            PLAYBACK
          </p>
        )}
        {currentView === "docs" && (
          <p className="text-xs md:text-sm tracking-widest opacity-60 font-mono">
            DOCUMENTATION
          </p>
        )}
      </div>

      {/* Top Right */}
      <div className="text-right space-y-1 text-xs md:text-sm tracking-widest opacity-70">
        <p>MODE</p>
        <p>
          {currentView === "player"
            ? "PLAYBACK"
            : currentView === "processing"
            ? "PROCESSING"
            : currentView === "docs"
            ? "DOCS"
            : "CONVERT"}
        </p>
        <p className="text-green-400 animate-pulse">// ONLINE</p>
      </div>
    </div>
  );
}
