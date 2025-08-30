/**
 * Animated Terminal Component
 * Plays back ASCII frames in sequence, similar to Ghostty's animated terminal
 */

import React, { useState, useEffect, useRef } from 'react';
import { ASCIIFrame } from '@/lib/types';
import TerminalDisplay from './TerminalDisplay';

interface AnimatedTerminalProps {
  frames: ASCIIFrame[];
  fps?: number;
  autoPlay?: boolean;
  loop?: boolean;
  title?: string;
  fontSize?: 'small' | 'medium' | 'large';
  className?: string;
}

export default function AnimatedTerminal({
  frames,
  fps = 24,
  autoPlay = true,
  loop = true,
  title = "ASCII Video",
  fontSize = 'medium',
  className = ''
}: AnimatedTerminalProps) {
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Animation control
  useEffect(() => {
    if (isPlaying && frames.length > 0) {
      const frameTime = 1000 / fps;
      
      intervalRef.current = setInterval(() => {
        setCurrentFrameIndex(prevIndex => {
          const nextIndex = prevIndex + 1;
          if (nextIndex >= frames.length) {
            if (loop) {
              return 0;
            } else {
              setIsPlaying(false);
              return prevIndex;
            }
          }
          return nextIndex;
        });
      }, frameTime);
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
  }, [isPlaying, frames.length, fps, loop]);

  // Pause animation when component is not visible (performance optimization)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsPlaying(false);
      } else if (autoPlay) {
        setIsPlaying(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [autoPlay]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setCurrentFrameIndex(0);
    setIsPlaying(autoPlay);
  };

  const handleFrameSeek = (frameIndex: number) => {
    setCurrentFrameIndex(Math.max(0, Math.min(frameIndex, frames.length - 1)));
  };

  if (frames.length === 0) {
    return (
      <TerminalDisplay 
        frame={null} 
        title={title} 
        fontSize={fontSize} 
        className={className} 
      />
    );
  }

  const currentFrame = frames[currentFrameIndex];
  const progress = frames.length > 1 ? (currentFrameIndex / (frames.length - 1)) * 100 : 0;

  return (
    <div className={`animated-terminal ${className}`}>
      <TerminalDisplay 
        frame={currentFrame} 
        title={`${title} - Frame ${currentFrameIndex + 1}/${frames.length}`}
        fontSize={fontSize}
      />
      
      <div className="animation-controls">
        <div className="playback-controls">
          <button 
            onClick={handlePlayPause}
            className="control-btn play-pause"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? '⏸️' : '▶️'}
          </button>
          
          <button 
            onClick={handleReset}
            className="control-btn reset"
            title="Reset to start"
          >
            ⏮️
          </button>
          
          <span className="frame-info">
            {currentFrameIndex + 1} / {frames.length}
          </span>
        </div>
        
        <div className="progress-container">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progress}%` }}
            />
          </div>
          <input
            type="range"
            min="0"
            max={frames.length - 1}
            value={currentFrameIndex}
            onChange={(e) => handleFrameSeek(parseInt(e.target.value))}
            className="frame-slider"
          />
        </div>
        
        <div className="fps-info">
          {fps} FPS
        </div>
      </div>

      <style jsx>{`
        .animated-terminal {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .animation-controls {
          background: #2d2d2d;
          border: 1px solid #333;
          border-radius: 6px;
          padding: 12px;
          display: flex;
          align-items: center;
          gap: 16px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .playback-controls {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .control-btn {
          background: #444;
          border: 1px solid #555;
          border-radius: 4px;
          padding: 6px 10px;
          color: #fff;
          cursor: pointer;
          font-size: 14px;
          transition: background-color 0.2s;
        }
        
        .control-btn:hover {
          background: #555;
        }
        
        .control-btn:active {
          background: #333;
        }
        
        .frame-info {
          color: #ccc;
          font-size: 12px;
          font-family: monospace;
          min-width: 60px;
        }
        
        .progress-container {
          flex: 1;
          position: relative;
          display: flex;
          align-items: center;
        }
        
        .progress-bar {
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 4px;
          background: #444;
          border-radius: 2px;
          transform: translateY(-50%);
          pointer-events: none;
        }
        
        .progress-fill {
          height: 100%;
          background: #0066ff;
          border-radius: 2px;
          transition: width 0.1s ease;
        }
        
        .frame-slider {
          width: 100%;
          height: 20px;
          background: transparent;
          cursor: pointer;
          -webkit-appearance: none;
          appearance: none;
        }
        
        .frame-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          background: #0066ff;
          border-radius: 50%;
          cursor: pointer;
        }
        
        .frame-slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          background: #0066ff;
          border-radius: 50%;
          cursor: pointer;
          border: none;
        }
        
        .fps-info {
          color: #888;
          font-size: 11px;
          font-family: monospace;
          min-width: 40px;
          text-align: right;
        }
        
        @media (max-width: 768px) {
          .animation-controls {
            flex-direction: column;
            gap: 12px;
          }
          
          .playback-controls {
            width: 100%;
            justify-content: center;
          }
          
          .progress-container {
            width: 100%;
          }
          
          .fps-info {
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}