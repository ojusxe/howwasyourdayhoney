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
      <div className="bg-black rounded-lg p-4 overflow-auto">
        <pre className="text-green-400 font-mono text-xs leading-tight whitespace-pre">
          {frames[currentFrameIndex]}
        </pre>
      </div>

      <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
        <div className="flex items-center space-x-3">
          <button
            onClick={togglePlayback}
            className="flex items-center justify-center w-10 h-10 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors"
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

          <div className="text-sm text-gray-600">
            Frame {currentFrameIndex + 1} of {frames.length}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => goToFrame(0)}
            className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded transition-colors"
          >
            First
          </button>
          <button
            onClick={() => goToFrame(currentFrameIndex - 1)}
            className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded transition-colors"
            disabled={currentFrameIndex === 0}
          >
            Prev
          </button>
          <button
            onClick={() => goToFrame(currentFrameIndex + 1)}
            className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded transition-colors"
            disabled={currentFrameIndex === frames.length - 1}
          >
            Next
          </button>
          <button
            onClick={() => goToFrame(frames.length - 1)}
            className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded transition-colors"
          >
            Last
          </button>
        </div>
      </div>
    </div>
  );
}