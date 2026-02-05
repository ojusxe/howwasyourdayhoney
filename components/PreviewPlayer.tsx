'use client';

import { useState, useEffect, useRef } from 'react';

interface PreviewPlayerProps {
  frames: string[];
  fps?: number;
  isPlaying?: boolean;
  onPlayStateChange?: (playing: boolean) => void;
}

export default function PreviewPlayer({ 
  frames, 
  fps = 24, 
  isPlaying = true,
  onPlayStateChange 
}: PreviewPlayerProps) {
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [playing, setPlaying] = useState(isPlaying);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (playing && frames.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentFrameIndex((prev) => (prev + 1) % frames.length);
      }, 1000 / fps);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [playing, frames.length, fps]);

  const togglePlayback = () => {
    const newPlaying = !playing;
    setPlaying(newPlaying);
    onPlayStateChange?.(newPlaying);
  };

  const goToFrame = (index: number) => {
    setCurrentFrameIndex(Math.max(0, Math.min(index, frames.length - 1)));
  };

  if (frames.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="bg-black/80 rounded-lg p-4 overflow-auto max-h-[400px] border border-white/10">
        <pre className="text-green-400 font-mono text-xs leading-tight whitespace-pre">
          {frames[currentFrameIndex]}
        </pre>
      </div>

      <div className="flex items-center justify-between bg-black/40 border border-white/20 rounded-lg p-3">
        <div className="flex items-center space-x-3">
          <button
            onClick={togglePlayback}
            className="flex items-center justify-center w-10 h-10 bg-green-500/20 border border-green-500/50 hover:bg-green-500 text-green-400 hover:text-black rounded-full transition-colors"
          >
            {playing ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
              </svg>
            ) : (
              <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            )}
          </button>

          <div className="text-sm text-white/70 font-mono">
            {currentFrameIndex + 1} / {frames.length}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => goToFrame(0)}
            className="px-2 py-1 text-xs bg-white/10 hover:bg-white/20 text-white/70 rounded transition-colors font-mono"
          >
            |&lt;
          </button>
          <button
            onClick={() => goToFrame(currentFrameIndex - 1)}
            className="px-2 py-1 text-xs bg-white/10 hover:bg-white/20 text-white/70 rounded transition-colors font-mono disabled:opacity-30"
            disabled={currentFrameIndex === 0}
          >
            &lt;
          </button>
          <button
            onClick={() => goToFrame(currentFrameIndex + 1)}
            className="px-2 py-1 text-xs bg-white/10 hover:bg-white/20 text-white/70 rounded transition-colors font-mono disabled:opacity-30"
            disabled={currentFrameIndex === frames.length - 1}
          >
            &gt;
          </button>
          <button
            onClick={() => goToFrame(frames.length - 1)}
            className="px-2 py-1 text-xs bg-white/10 hover:bg-white/20 text-white/70 rounded transition-colors font-mono"
          >
            &gt;|
          </button>
        </div>
      </div>
    </div>
  );
}