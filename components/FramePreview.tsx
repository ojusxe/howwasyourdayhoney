'use client';

import { useEffect, useRef } from 'react';
import { FramePreviewProps } from '@/lib/types';

export default function FramePreview({ frame, settings }: FramePreviewProps) {
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!frame || !previewRef.current) return;

    const container = previewRef.current;
    
    // Clear previous content
    container.innerHTML = '';

    if (frame.colorData && settings.colorMode !== 'blackwhite') {
      // Render with color data
      renderColoredFrame(container, frame);
    } else {
      // Render as plain text
      container.textContent = frame.asciiContent;
    }
  }, [frame, settings]);

  const renderColoredFrame = (container: HTMLElement, frame: any) => {
    const lines = frame.asciiContent.split('\n');
    
    lines.forEach((line: string, y: number) => {
      const lineDiv = document.createElement('div');
      lineDiv.style.height = '1em';
      lineDiv.style.lineHeight = '1';
      
      for (let x = 0; x < line.length; x++) {
        const char = line[x];
        const span = document.createElement('span');
        span.textContent = char;
        
        // Apply color if available
        if (frame.colorData && frame.colorData[y] && frame.colorData[y][x]) {
          const colorInfo = frame.colorData[y][x];
          if (colorInfo.color && colorInfo.color !== 'transparent') {
            span.style.color = colorInfo.color;
          }
          if (colorInfo.background && colorInfo.background !== 'transparent') {
            span.style.backgroundColor = colorInfo.background;
          }
        }
        
        lineDiv.appendChild(span);
      }
      
      container.appendChild(lineDiv);
    });
  };

  const getBackgroundStyle = () => {
    switch (settings.background) {
      case 'black':
        return 'bg-black text-white';
      case 'white':
        return 'bg-white text-black border border-gray-200';
      case 'transparent':
      default:
        return 'bg-transparent text-gray-900';
    }
  };

  if (!frame) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <div className="text-gray-400 mb-2">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-sm text-gray-500">Frame preview will appear here</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Frame Preview</h3>
        <div className="text-sm text-gray-500">
          Frame {frame.index + 1} • {frame.width}×{frame.height}
        </div>
      </div>

      <div className="relative">
        {/* Preview Container */}
        <div 
          className={`
            ascii-frame p-4 rounded-md overflow-auto max-h-96 text-xs leading-none
            ${getBackgroundStyle()}
          `}
          style={{
            fontFamily: 'JetBrains Mono, Consolas, Monaco, monospace',
            whiteSpace: 'pre',
            wordBreak: 'keep-all',
            overflowWrap: 'normal'
          }}
        >
          <div ref={previewRef} />
        </div>

        {/* Scale indicator */}
        <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
          {(settings.resolutionScale * 100).toFixed(0)}% scale
        </div>
      </div>

      {/* Frame Info */}
      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-500">Timestamp:</span>
          <span className="ml-2 font-mono">{frame.timestamp.toFixed(3)}s</span>
        </div>
        <div>
          <span className="text-gray-500">Characters:</span>
          <span className="ml-2 font-mono">{frame.asciiContent.length}</span>
        </div>
      </div>

      {/* Settings Summary */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
          <div>
            <span className="font-medium">Character Set:</span>
            <span className="ml-1">
              {settings.characterSet === 'custom' 
                ? settings.customCharacters || 'Default'
                : 'Default'
              }
            </span>
          </div>
          <div>
            <span className="font-medium">Color Mode:</span>
            <span className="ml-1 capitalize">{settings.colorMode.replace('blackwhite', 'B&W')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}